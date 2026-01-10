import { createId } from '@paralleldrive/cuid2';

/**
 * CommunityId Value Object
 *
 * Type-safe identifier for Community aggregates.
 *
 * Business rules:
 * - CommunityId cannot be empty
 * - CommunityId must be a valid CUID
 * - CommunityId is immutable once created
 */
export class CommunityId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  /**
   * Generate a new unique CommunityId
   */
  static generate(): CommunityId {
    return new CommunityId(createId());
  }

  /**
   * Create CommunityId from existing string value
   * @param value - The string representation of the CommunityId
   */
  static fromString(value: string): CommunityId {
    return new CommunityId(value);
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('CommunityId cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  /**
   * Compare this CommunityId with another
   */
  equals(other: CommunityId): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
