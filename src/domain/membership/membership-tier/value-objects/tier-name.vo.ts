/**
 * Tier Name Value Object
 *
 * Represents a membership tier name.
 *
 * Business rules:
 * - Must be between 3 and 50 characters
 * - Cannot be empty
 */
export class TierName {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  static create(value: string): TierName {
    return new TierName(value);
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Tier name cannot be empty');
    }

    const trimmed = value.trim();

    if (trimmed.length < 3) {
      throw new Error('Tier name must be at least 3 characters');
    }

    if (trimmed.length > 50) {
      throw new Error('Tier name must be at most 50 characters');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: TierName): boolean {
    if (!(other instanceof TierName)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
