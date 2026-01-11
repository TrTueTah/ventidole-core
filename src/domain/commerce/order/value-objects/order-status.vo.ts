/**
 * Order Status Value Object
 *
 * Represents the status of an order with state transition validation.
 *
 * Business rules:
 * - Order follows a specific flow
 * - Not all transitions are valid
 */
export enum OrderStatusEnum {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  CONFIRMED = 'CONFIRMED',
  PAID = 'PAID',
  SHIPPING = 'SHIPPING',
  DELIVERED = 'DELIVERED',
  CANCELED = 'CANCELED',
  EXPIRED = 'EXPIRED',
}

export class OrderStatus {
  private readonly _value: OrderStatusEnum;

  private constructor(value: OrderStatusEnum) {
    this._value = value;
  }

  static create(value: string): OrderStatus {
    const upperValue = value.toUpperCase();

    if (!Object.values(OrderStatusEnum).includes(upperValue as OrderStatusEnum)) {
      throw new Error(`Invalid order status: ${value}`);
    }

    return new OrderStatus(upperValue as OrderStatusEnum);
  }

  static pendingPayment(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PENDING_PAYMENT);
  }

  static confirmed(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CONFIRMED);
  }

  static paid(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.PAID);
  }

  static shipping(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.SHIPPING);
  }

  static delivered(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.DELIVERED);
  }

  static canceled(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.CANCELED);
  }

  static expired(): OrderStatus {
    return new OrderStatus(OrderStatusEnum.EXPIRED);
  }

  get value(): string {
    return this._value;
  }

  /**
   * Check if transition to new status is valid
   */
  canTransitionTo(newStatus: OrderStatus): boolean {
    const transitions: Record<OrderStatusEnum, OrderStatusEnum[]> = {
      [OrderStatusEnum.PENDING_PAYMENT]: [
        OrderStatusEnum.PAID, // CREDIT: payment confirmed
        OrderStatusEnum.CONFIRMED, // COD: order confirmed
        OrderStatusEnum.EXPIRED,
        OrderStatusEnum.CANCELED,
      ],
      [OrderStatusEnum.CONFIRMED]: [
        OrderStatusEnum.PAID,
        OrderStatusEnum.SHIPPING, // COD: ship directly
        OrderStatusEnum.CANCELED,
      ],
      [OrderStatusEnum.PAID]: [
        OrderStatusEnum.SHIPPING,
        OrderStatusEnum.CANCELED,
      ],
      [OrderStatusEnum.SHIPPING]: [
        OrderStatusEnum.DELIVERED,
      ],
      [OrderStatusEnum.DELIVERED]: [], // Final state
      [OrderStatusEnum.CANCELED]: [], // Final state
      [OrderStatusEnum.EXPIRED]: [], // Final state
    };

    return transitions[this._value].includes(newStatus._value);
  }

  isPendingPayment(): boolean {
    return this._value === OrderStatusEnum.PENDING_PAYMENT;
  }

  isConfirmed(): boolean {
    return this._value === OrderStatusEnum.CONFIRMED;
  }

  isPaid(): boolean {
    return this._value === OrderStatusEnum.PAID;
  }

  isShipping(): boolean {
    return this._value === OrderStatusEnum.SHIPPING;
  }

  isDelivered(): boolean {
    return this._value === OrderStatusEnum.DELIVERED;
  }

  isCanceled(): boolean {
    return this._value === OrderStatusEnum.CANCELED;
  }

  isExpired(): boolean {
    return this._value === OrderStatusEnum.EXPIRED;
  }

  isFinalState(): boolean {
    return (
      this._value === OrderStatusEnum.DELIVERED ||
      this._value === OrderStatusEnum.CANCELED ||
      this._value === OrderStatusEnum.EXPIRED
    );
  }

  equals(other: OrderStatus): boolean {
    if (!(other instanceof OrderStatus)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
