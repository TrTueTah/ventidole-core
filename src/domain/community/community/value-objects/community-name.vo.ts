/**
 * Community Name Value Object
 *
 * Represents a valid community name.
 *
 * Business rules:
 * - Must be between 3 and 100 characters
 * - Cannot be empty or only whitespace
 * - Should be trimmed
 */
export class CommunityName {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value.trim();
  }

  static create(value: string): CommunityName {
    return new CommunityName(value);
  }

  private validate(value: string): void {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Community name cannot be empty');
    }

    if (trimmed.length < 3) {
      throw new Error('Community name must be at least 3 characters long');
    }

    if (trimmed.length > 100) {
      throw new Error('Community name cannot exceed 100 characters');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: CommunityName): boolean {
    if (!(other instanceof CommunityName)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
