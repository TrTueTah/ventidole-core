/**
 * Email Value Object
 *
 * Represents a valid email address.
 *
 * Business rules:
 * - Email cannot be empty
 * - Email must be a valid format (basic regex validation)
 * - Email cannot exceed 255 characters
 * - Email is case-insensitive (normalized to lowercase)
 * - Email is immutable once created
 */
export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value.toLowerCase().trim();
  }

  static create(value: string): Email {
    return new Email(value);
  }

  private validate(value: string): void {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Email cannot be empty');
    }

    if (trimmed.length > 255) {
      throw new Error('Email cannot exceed 255 characters');
    }

    // Basic email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmed)) {
      throw new Error('Invalid email format');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: Email): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
