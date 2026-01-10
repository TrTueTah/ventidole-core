import { cuid } from '@paralleldrive/cuid2';

/**
 * Shop ID Value Object
 *
 * Unique identifier for shops.
 */
export class ShopId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  static generate(): ShopId {
    return new ShopId(cuid());
  }

  static fromString(value: string): ShopId {
    return new ShopId(value);
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('ShopId cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: ShopId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
