/**
 * PasswordHash Value Object
 *
 * Represents a hashed password (bcrypt).
 *
 * Business rules:
 * - PasswordHash cannot be empty
 * - Stores only the hashed value, never plain text
 * - Password hashing is done by the application layer
 * - PasswordHash is immutable once created
 *
 * Note: This value object stores the HASH, not the plain password.
 * Hashing should be done in the application layer before creating this VO.
 */
export class PasswordHash {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  /**
   * Create from an already-hashed password
   * @param hashedPassword - The bcrypt hash
   */
  static create(hashedPassword: string): PasswordHash {
    return new PasswordHash(hashedPassword);
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('Password hash cannot be empty');
    }

    // Basic validation: bcrypt hashes start with $2a$, $2b$, or $2y$
    // and are 60 characters long
    if (!value.startsWith('$2') || value.length !== 60) {
      throw new Error('Invalid password hash format');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: PasswordHash): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return '[REDACTED]'; // Never expose the hash
  }
}
