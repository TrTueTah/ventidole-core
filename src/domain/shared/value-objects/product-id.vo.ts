import { cuid } from '@paralleldrive/cuid2';

/**
 * Product ID Value Object
 *
 * Unique identifier for products.
 */
export class ProductId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  static generate(): ProductId {
    return new ProductId(cuid());
  }

  static fromString(value: string): ProductId {
    return new ProductId(value);
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('ProductId cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: ProductId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
