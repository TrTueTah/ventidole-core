/**
 * Bio Value Object
 *
 * Represents a user's biography/description.
 *
 * Business rules:
 * - Bio can be null/empty (optional field)
 * - Bio cannot exceed 500 characters
 * - Bio is immutable once created
 */
export class Bio {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value.trim();
  }

  static create(value: string | null): Bio | null {
    if (!value || value.trim().length === 0) {
      return null;
    }
    return new Bio(value);
  }

  private validate(value: string): void {
    const trimmed = value.trim();

    if (trimmed.length > 500) {
      throw new Error('Bio cannot exceed 500 characters');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: Bio): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
