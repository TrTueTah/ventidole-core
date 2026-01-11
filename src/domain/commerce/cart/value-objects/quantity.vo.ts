/**
 * Quantity Value Object
 *
 * Represents a product quantity in a cart.
 *
 * Business Rules:
 * - Must be positive (min: 1)
 * - Cannot exceed maximum (max: 999)
 */
export class Quantity {
  private static readonly MIN = 1;
  private static readonly MAX = 999;

  private readonly _value: number;

  private constructor(value: number) {
    this.validate(value);
    this._value = value;
  }

  static create(value: number): Quantity {
    return new Quantity(value);
  }

  private validate(value: number): void {
    if (!Number.isInteger(value)) {
      throw new Error('Quantity must be an integer');
    }

    if (value < Quantity.MIN) {
      throw new Error(`Quantity must be at least ${Quantity.MIN}`);
    }

    if (value > Quantity.MAX) {
      throw new Error(`Quantity cannot exceed ${Quantity.MAX}`);
    }
  }

  get value(): number {
    return this._value;
  }

  /**
   * Add to current quantity
   */
  add(amount: number): Quantity {
    return new Quantity(this._value + amount);
  }

  /**
   * Subtract from current quantity
   */
  subtract(amount: number): Quantity {
    return new Quantity(this._value - amount);
  }

  /**
   * Check if quantity exceeds limit
   */
  exceedsLimit(): boolean {
    return this._value > Quantity.MAX;
  }

  /**
   * Check if quantity is at minimum
   */
  isMinimum(): boolean {
    return this._value === Quantity.MIN;
  }

  equals(other: Quantity): boolean {
    if (!(other instanceof Quantity)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value.toString();
  }
}
