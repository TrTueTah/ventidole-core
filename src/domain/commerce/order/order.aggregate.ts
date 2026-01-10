import { DomainEvent } from '@core/event/domain-event.base';
import { OrderId } from '@domain/shared/value-objects/order-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { OrderStatus } from './value-objects/order-status.vo';
import { PaymentMethod } from './value-objects/payment-method.vo';
import { Money } from './value-objects/money.vo';
import { ShippingAddress } from './value-objects/shipping-address.vo';
import { OrderItem } from './entities/order-item.entity';
import {
  OrderCreatedEvent,
  OrderConfirmedEvent,
  OrderPaidEvent,
  OrderShippedEvent,
  OrderDeliveredEvent,
  OrderCanceledEvent,
} from './events';

/**
 * Order Aggregate Root
 *
 * Represents a customer order with state machine.
 *
 * Business Rules (Invariants):
 * - Order must have at least one item
 * - Order total must equal sum of item totals
 * - Status transitions follow strict flow
 * - Cannot modify order in final states (DELIVERED, CANCELED, EXPIRED)
 * - Payment method determines flow (CREDIT: pay first, COD: pay on delivery)
 *
 * State Machine:
 * PENDING_PAYMENT → CONFIRMED → PAID → SHIPPING → DELIVERED
 *                ↓            ↓      ↓
 *              EXPIRED   CANCELED  CANCELED
 *
 * Aggregate Boundary:
 * - Order (root)
 * - OrderItem (entity collection)
 */
export class OrderAggregate {
  private readonly _id: OrderId;
  private readonly _customerId: UserId;
  private readonly _shopId: string;
  private _status: OrderStatus;
  private readonly _items: Map<string, OrderItem>; // productId -> OrderItem
  private readonly _shippingAddress: ShippingAddress;
  private readonly _paymentMethod: PaymentMethod;
  private _paymentId: string | null;
  private _trackingNumber: string | null;
  private _cancelReason: string | null;
  private readonly _totalAmount: Money;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(props: {
    id: OrderId;
    customerId: UserId;
    shopId: string;
    status: OrderStatus;
    items: Map<string, OrderItem>;
    shippingAddress: ShippingAddress;
    paymentMethod: PaymentMethod;
    paymentId: string | null;
    trackingNumber: string | null;
    cancelReason: string | null;
    totalAmount: Money;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._customerId = props.customerId;
    this._shopId = props.shopId;
    this._status = props.status;
    this._items = props.items;
    this._shippingAddress = props.shippingAddress;
    this._paymentMethod = props.paymentMethod;
    this._paymentId = props.paymentId;
    this._trackingNumber = props.trackingNumber;
    this._cancelReason = props.cancelReason;
    this._totalAmount = props.totalAmount;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._domainEvents = [];
  }

  /**
   * Factory method: Create new order
   */
  static create(props: {
    customerId: string;
    shopId: string;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
    }>;
    shippingAddress: {
      recipientName: string;
      phoneNumber: string;
      addressLine: string;
      ward: string;
      district: string;
      province: string;
      postalCode: string;
    };
    paymentMethod: string;
  }): OrderAggregate {
    // Invariant: Must have at least one item
    if (props.items.length === 0) {
      throw new Error('Order must have at least one item');
    }

    // Create order items
    const itemsMap = new Map<string, OrderItem>();
    let totalAmount = Money.zero();

    for (const itemData of props.items) {
      const item = OrderItem.create(itemData);
      itemsMap.set(item.productId, item);
      totalAmount = totalAmount.add(item.total);
    }

    const order = new OrderAggregate({
      id: OrderId.generate(),
      customerId: UserId.fromString(props.customerId),
      shopId: props.shopId,
      status: OrderStatus.pendingPayment(),
      items: itemsMap,
      shippingAddress: ShippingAddress.create(props.shippingAddress),
      paymentMethod: PaymentMethod.create(props.paymentMethod),
      paymentId: null,
      trackingNumber: null,
      cancelReason: null,
      totalAmount,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    order.addDomainEvent(
      new OrderCreatedEvent(
        order._id.value,
        order._customerId.value,
        order._shopId,
        order._totalAmount.amount,
        order._paymentMethod.value,
      ),
    );

    return order;
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static fromPersistence(props: {
    id: string;
    customerId: string;
    shopId: string;
    status: string;
    shippingAddress: {
      recipientName: string;
      phoneNumber: string;
      addressLine: string;
      ward: string;
      district: string;
      province: string;
      postalCode: string;
    };
    paymentMethod: string;
    paymentId: string | null;
    trackingNumber: string | null;
    cancelReason: string | null;
    totalAmount: number;
    createdAt: Date;
    updatedAt: Date;
    items: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
    }>;
  }): OrderAggregate {
    const itemsMap = new Map<string, OrderItem>();

    for (const itemData of props.items) {
      const item = OrderItem.fromPersistence(itemData);
      itemsMap.set(item.productId, item);
    }

    return new OrderAggregate({
      id: OrderId.fromString(props.id),
      customerId: UserId.fromString(props.customerId),
      shopId: props.shopId,
      status: OrderStatus.create(props.status),
      items: itemsMap,
      shippingAddress: ShippingAddress.create(props.shippingAddress),
      paymentMethod: PaymentMethod.create(props.paymentMethod),
      paymentId: props.paymentId,
      trackingNumber: props.trackingNumber,
      cancelReason: props.cancelReason,
      totalAmount: Money.fromAmount(props.totalAmount),
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Business method: Confirm order (shop accepts)
   */
  confirm(): void {
    // Invariant: Can only confirm from PENDING_PAYMENT
    const newStatus = OrderStatus.confirmed();

    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot confirm order in status: ${this._status.value}`,
      );
    }

    this._status = newStatus;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new OrderConfirmedEvent(this._id.value, this._shopId),
    );
  }

  /**
   * Business method: Mark order as paid
   */
  markAsPaid(paymentId: string): void {
    // Invariant: Can only mark paid from CONFIRMED
    const newStatus = OrderStatus.paid();

    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot mark order as paid in status: ${this._status.value}`,
      );
    }

    this._status = newStatus;
    this._paymentId = paymentId;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new OrderPaidEvent(
        this._id.value,
        paymentId,
        this._totalAmount.amount,
      ),
    );
  }

  /**
   * Business method: Ship order
   */
  ship(trackingNumber?: string): void {
    // Invariant: Can only ship from PAID
    const newStatus = OrderStatus.shipping();

    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot ship order in status: ${this._status.value}`,
      );
    }

    this._status = newStatus;
    this._trackingNumber = trackingNumber || null;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new OrderShippedEvent(this._id.value, this._trackingNumber),
    );
  }

  /**
   * Business method: Mark order as delivered
   */
  deliver(): void {
    // Invariant: Can only deliver from SHIPPING
    const newStatus = OrderStatus.delivered();

    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot deliver order in status: ${this._status.value}`,
      );
    }

    this._status = newStatus;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new OrderDeliveredEvent(this._id.value, this._customerId.value),
    );
  }

  /**
   * Business method: Cancel order
   */
  cancel(reason?: string): void {
    // Invariant: Cannot cancel if already in final state
    if (this._status.isFinalState()) {
      throw new Error(
        `Cannot cancel order in final status: ${this._status.value}`,
      );
    }

    // Check if cancellation is allowed from current status
    const newStatus = OrderStatus.canceled();

    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot cancel order in status: ${this._status.value}`,
      );
    }

    this._status = newStatus;
    this._cancelReason = reason || null;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new OrderCanceledEvent(this._id.value, this._cancelReason),
    );
  }

  /**
   * Business method: Mark order as expired
   */
  expire(): void {
    // Invariant: Can only expire from PENDING_PAYMENT
    const newStatus = OrderStatus.expired();

    if (!this._status.canTransitionTo(newStatus)) {
      throw new Error(
        `Cannot expire order in status: ${this._status.value}`,
      );
    }

    this._status = newStatus;
    this._updatedAt = new Date();
  }

  /**
   * Query method: Check if order belongs to customer
   */
  belongsToCustomer(customerId: UserId): boolean {
    return this._customerId.equals(customerId);
  }

  /**
   * Query method: Check if order belongs to shop
   */
  belongsToShop(shopId: string): boolean {
    return this._shopId === shopId;
  }

  /**
   * Query method: Get order items as array
   */
  getItems(): ReadonlyArray<OrderItem> {
    return Array.from(this._items.values());
  }

  /**
   * Query method: Calculate total (verify invariant)
   */
  calculateTotal(): Money {
    let total = Money.zero();

    for (const item of this._items.values()) {
      total = total.add(item.total);
    }

    return total;
  }

  // Getters
  get id(): OrderId {
    return this._id;
  }

  get customerId(): UserId {
    return this._customerId;
  }

  get shopId(): string {
    return this._shopId;
  }

  get status(): OrderStatus {
    return this._status;
  }

  get shippingAddress(): ShippingAddress {
    return this._shippingAddress;
  }

  get paymentMethod(): PaymentMethod {
    return this._paymentMethod;
  }

  get paymentId(): string | null {
    return this._paymentId;
  }

  get trackingNumber(): string | null {
    return this._trackingNumber;
  }

  get cancelReason(): string | null {
    return this._cancelReason;
  }

  get totalAmount(): Money {
    return this._totalAmount;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }
}
