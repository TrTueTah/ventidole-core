import { createId } from '@paralleldrive/cuid2';

/**
 * UserId Value Object
 *
 * Type-safe identifier for User aggregates.
 *
 * Business rules:
 * - UserId cannot be empty
 * - UserId must be a valid CUID
 * - UserId is immutable once created
 *
 * Usage:
 * ```typescript
 * // Generate new ID
 * const id = UserId.generate();
 *
 * // Reconstitute from string (e.g., from database)
 * const id = UserId.fromString('abc123');
 * ```
 */
export class UserId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  /**
   * Generate a new unique UserId
   */
  static generate(): UserId {
    return new UserId(createId());
  }

  /**
   * Create UserId from existing string value
   * @param value - The string representation of the UserId
   */
  static fromString(value: string): UserId {
    return new UserId(value);
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('UserId cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  /**
   * Compare this UserId with another
   */
  equals(other: UserId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
