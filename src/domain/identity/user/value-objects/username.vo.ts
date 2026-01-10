/**
 * Username Value Object
 *
 * Represents a unique username.
 *
 * Business rules:
 * - Username cannot be empty
 * - Username must be between 3 and 30 characters
 * - Username can only contain alphanumeric characters, underscores, and hyphens
 * - Username is case-insensitive (normalized to lowercase)
 * - Username is immutable once created
 */
export class Username {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value.toLowerCase().trim();
  }

  static create(value: string): Username {
    return new Username(value);
  }

  private validate(value: string): void {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Username cannot be empty');
    }

    if (trimmed.length < 3) {
      throw new Error('Username must be at least 3 characters');
    }

    if (trimmed.length > 30) {
      throw new Error('Username cannot exceed 30 characters');
    }

    // Only alphanumeric, underscores, and hyphens
    const usernameRegex = /^[a-zA-Z0-9_-]+$/;
    if (!usernameRegex.test(trimmed)) {
      throw new Error('Username can only contain letters, numbers, underscores, and hyphens');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: Username): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
