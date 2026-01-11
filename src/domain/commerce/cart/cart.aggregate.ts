import { CartId } from '@domain/shared/value-objects/cart-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { Money } from '@domain/commerce/order/value-objects/money.vo';
import { CartStatus } from './value-objects/cart-status.vo';
import { CartItemEntity } from './entities/cart-item.entity';
import { DomainEvent } from '@core/event/domain-event.interface';
import { CartCreatedEvent } from './events/cart-created.event';
import { ItemAddedToCartEvent } from './events/item-added-to-cart.event';
import { ItemRemovedFromCartEvent } from './events/item-removed-from-cart.event';
import { ItemQuantityUpdatedEvent } from './events/item-quantity-updated.event';
import { CartClearedEvent } from './events/cart-cleared.event';

/**
 * Cart Aggregate Root
 *
 * Manages a user's shopping cart with items.
 *
 * Business Rules:
 * - One active cart per user
 * - Cart can only be modified when status is ACTIVE
 * - Adding duplicate product+variant updates quantity
 * - Cannot checkout empty cart
 * - Cart total calculated from items
 *
 * Invariants:
 * - Quantity must be positive (1-999)
 * - Status transitions must be valid
 */
export class CartAggregate {
  private readonly _id: CartId;
  private readonly _userId: UserId;
  private _status: CartStatus;
  private _items: CartItemEntity[];
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(props: {
    id: CartId;
    userId: UserId;
    status: CartStatus;
    items: CartItemEntity[];
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._userId = props.userId;
    this._status = props.status;
    this._items = props.items;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._domainEvents = [];
  }

  /**
   * Create new cart for user
   */
  static create(userId: string): CartAggregate {
    const now = new Date();
    const cartId = CartId.generate();

    const cart = new CartAggregate({
      id: cartId,
      userId: UserId.fromString(userId),
      status: CartStatus.active(),
      items: [],
      createdAt: now,
      updatedAt: now,
    });

    cart.addDomainEvent(
      new CartCreatedEvent(
        cartId.value,
        userId,
        now,
      ),
    );

    return cart;
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(data: {
    id: string;
    userId: string;
    status: string;
    items: Array<{
      id: string;
      productId: string;
      productName: string;
      variantId: string | null;
      quantity: number;
      unitPrice: number;
    }>;
    createdAt: Date;
    updatedAt: Date;
  }): CartAggregate {
    const items = data.items.map((item) => CartItemEntity.fromPersistence(item));

    return new CartAggregate({
      id: CartId.fromString(data.id),
      userId: UserId.fromString(data.userId),
      status: CartStatus.create(data.status),
      items,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Add item to cart
   * If item already exists (same product+variant), increment quantity
   */
  addItem(
    productId: string,
    productName: string,
    variantId: string | null,
    quantity: number,
    unitPrice: number,
  ): void {
    this.ensureCanModify();

    // Check if item already exists
    const existingItem = this._items.find((item) =>
      item.matches(productId, variantId),
    );

    if (existingItem) {
      // Update existing item quantity
      const oldQuantity = existingItem.quantity.value;
      existingItem.incrementQuantity(quantity);

      this.addDomainEvent(
        new ItemQuantityUpdatedEvent(
          this._id.value,
          this._userId.value,
          existingItem.id.value,
          oldQuantity,
          existingItem.quantity.value,
        ),
      );
    } else {
      // Add new item
      const newItem = CartItemEntity.create({
        productId,
        productName,
        variantId,
        quantity,
        unitPrice,
      });

      this._items.push(newItem);

      this.addDomainEvent(
        new ItemAddedToCartEvent(
          this._id.value,
          this._userId.value,
          productId,
          variantId,
          quantity,
          unitPrice,
        ),
      );
    }

    this._updatedAt = new Date();
  }

  /**
   * Update item quantity
   */
  updateItemQuantity(itemId: string, newQuantity: number): void {
    this.ensureCanModify();

    const item = this.findItemById(itemId);
    const oldQuantity = item.quantity.value;

    item.updateQuantity(newQuantity);

    this.addDomainEvent(
      new ItemQuantityUpdatedEvent(
        this._id.value,
        this._userId.value,
        itemId,
        oldQuantity,
        newQuantity,
      ),
    );

    this._updatedAt = new Date();
  }

  /**
   * Remove item from cart
   */
  removeItem(itemId: string): void {
    this.ensureCanModify();

    const item = this.findItemById(itemId);

    this._items = this._items.filter((i) => !i.id.equals(item.id));

    this.addDomainEvent(
      new ItemRemovedFromCartEvent(
        this._id.value,
        this._userId.value,
        itemId,
        item.productId.value,
      ),
    );

    this._updatedAt = new Date();
  }

  /**
   * Clear all items from cart
   */
  clear(reason: 'PAYMENT_SUCCESS' | 'MANUAL' | 'ABANDONED' = 'MANUAL'): void {
    this._items = [];
    this._updatedAt = new Date();

    this.addDomainEvent(
      new CartClearedEvent(
        this._id.value,
        this._userId.value,
        reason,
      ),
    );
  }

  /**
   * Mark cart as checked out
   */
  checkout(): void {
    if (this.isEmpty()) {
      throw new Error('Cannot checkout empty cart');
    }

    if (!this._status.canCheckout()) {
      throw new Error(`Cannot checkout cart with status: ${this._status.value}`);
    }

    this._status = CartStatus.checkedOut();
    this._updatedAt = new Date();
  }

  /**
   * Calculate total amount for all items
   */
  calculateTotal(): Money {
    if (this._items.length === 0) {
      return Money.fromAmount(0);
    }

    const totalAmount = this._items.reduce((total, item) => {
      return total + item.calculateTotal().amount;
    }, 0);

    return Money.fromAmount(totalAmount);
  }

  /**
   * Check if cart is empty
   */
  isEmpty(): boolean {
    return this._items.length === 0;
  }

  /**
   * Get item count
   */
  getItemCount(): number {
    return this._items.length;
  }

  /**
   * Get total quantity of all items
   */
  getTotalQuantity(): number {
    return this._items.reduce((total, item) => total + item.quantity.value, 0);
  }

  /**
   * Get all items
   */
  getItems(): CartItemEntity[] {
    return [...this._items]; // Return copy to prevent mutation
  }

  /**
   * Find item by ID
   */
  private findItemById(itemId: string): CartItemEntity {
    const item = this._items.find((i) => i.id.value === itemId);

    if (!item) {
      throw new Error(`Cart item not found: ${itemId}`);
    }

    return item;
  }

  /**
   * Ensure cart can be modified
   */
  private ensureCanModify(): void {
    if (!this._status.canAcceptItems()) {
      throw new Error(`Cannot modify cart with status: ${this._status.value}`);
    }
  }

  /**
   * Add domain event
   */
  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  /**
   * Get and clear domain events
   */
  get domainEvents(): DomainEvent[] {
    return [...this._domainEvents];
  }

  clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }

  // Getters
  get id(): CartId {
    return this._id;
  }

  get userId(): UserId {
    return this._userId;
  }

  get status(): CartStatus {
    return this._status;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }
}
