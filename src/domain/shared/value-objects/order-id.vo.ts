import { createId } from '@paralleldrive/cuid2';

/**
 * OrderId Value Object
 *
 * Type-safe identifier for Order aggregates.
 *
 * Business rules:
 * - OrderId cannot be empty
 * - OrderId must be a valid CUID
 * - OrderId is immutable once created
 */
export class OrderId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  /**
   * Generate a new unique OrderId
   */
  static generate(): OrderId {
    return new OrderId(createId());
  }

  /**
   * Create OrderId from existing string value
   * @param value - The string representation of the OrderId
   */
  static fromString(value: string): OrderId {
    return new OrderId(value);
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('OrderId cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  /**
   * Compare this OrderId with another
   */
  equals(other: OrderId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
