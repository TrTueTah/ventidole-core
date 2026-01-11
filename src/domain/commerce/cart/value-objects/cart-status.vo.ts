/**
 * Cart Status Value Object
 *
 * Represents the lifecycle status of a shopping cart.
 *
 * States:
 * - ACTIVE: Cart is being actively used
 * - CHECKED_OUT: Order has been created from cart
 * - ABANDONED: Cart inactive for extended period
 */
export enum CartStatusEnum {
  ACTIVE = 'ACTIVE',
  CHECKED_OUT = 'CHECKED_OUT',
  ABANDONED = 'ABANDONED',
}

export class CartStatus {
  private readonly _value: CartStatusEnum;

  private constructor(value: CartStatusEnum) {
    this._value = value;
  }

  static create(value: string): CartStatus {
    const upperValue = value.toUpperCase();

    if (!Object.values(CartStatusEnum).includes(upperValue as CartStatusEnum)) {
      throw new Error(`Invalid cart status: ${value}`);
    }

    return new CartStatus(upperValue as CartStatusEnum);
  }

  static active(): CartStatus {
    return new CartStatus(CartStatusEnum.ACTIVE);
  }

  static checkedOut(): CartStatus {
    return new CartStatus(CartStatusEnum.CHECKED_OUT);
  }

  static abandoned(): CartStatus {
    return new CartStatus(CartStatusEnum.ABANDONED);
  }

  get value(): string {
    return this._value;
  }

  isActive(): boolean {
    return this._value === CartStatusEnum.ACTIVE;
  }

  isCheckedOut(): boolean {
    return this._value === CartStatusEnum.CHECKED_OUT;
  }

  isAbandoned(): boolean {
    return this._value === CartStatusEnum.ABANDONED;
  }

  /**
   * Check if cart can accept new items
   */
  canAcceptItems(): boolean {
    return this._value === CartStatusEnum.ACTIVE;
  }

  /**
   * Check if cart can be checked out
   */
  canCheckout(): boolean {
    return this._value === CartStatusEnum.ACTIVE;
  }

  equals(other: CartStatus): boolean {
    if (!(other instanceof CartStatus)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
