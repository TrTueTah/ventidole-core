/**
 * Stock Value Object
 *
 * Represents product inventory quantity.
 */
export class Stock {
  private readonly _quantity: number;

  private constructor(quantity: number) {
    this.validate(quantity);
    this._quantity = quantity;
  }

  static create(quantity: number): Stock {
    return new Stock(quantity);
  }

  static zero(): Stock {
    return new Stock(0);
  }

  private validate(quantity: number): void {
    if (quantity < 0) {
      throw new Error('Stock quantity cannot be negative');
    }

    if (!Number.isInteger(quantity)) {
      throw new Error('Stock quantity must be an integer');
    }
  }

  get quantity(): number {
    return this._quantity;
  }

  /**
   * Check if product is in stock
   */
  isAvailable(): boolean {
    return this._quantity > 0;
  }

  /**
   * Check if sufficient stock for quantity
   */
  hasSufficient(requestedQuantity: number): boolean {
    return this._quantity >= requestedQuantity;
  }

  /**
   * Decrease stock by quantity
   */
  decrease(quantity: number): Stock {
    if (quantity < 0) {
      throw new Error('Cannot decrease by negative quantity');
    }

    const newQuantity = this._quantity - quantity;

    if (newQuantity < 0) {
      throw new Error('Insufficient stock');
    }

    return new Stock(newQuantity);
  }

  /**
   * Increase stock by quantity
   */
  increase(quantity: number): Stock {
    if (quantity < 0) {
      throw new Error('Cannot increase by negative quantity');
    }

    return new Stock(this._quantity + quantity);
  }

  equals(other: Stock): boolean {
    return this._quantity === other._quantity;
  }

  toString(): string {
    return this._quantity.toString();
  }
}
