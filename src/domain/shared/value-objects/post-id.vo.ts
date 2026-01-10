import { createId } from '@paralleldrive/cuid2';

/**
 * PostId Value Object
 *
 * Type-safe identifier for Post aggregates.
 *
 * Business rules:
 * - PostId cannot be empty
 * - PostId must be a valid CUID
 * - PostId is immutable once created
 */
export class PostId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  /**
   * Generate a new unique PostId
   */
  static generate(): PostId {
    return new PostId(createId());
  }

  /**
   * Create PostId from existing string value
   * @param value - The string representation of the PostId
   */
  static fromString(value: string): PostId {
    return new PostId(value);
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('PostId cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  /**
   * Compare this PostId with another
   */
  equals(other: PostId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
