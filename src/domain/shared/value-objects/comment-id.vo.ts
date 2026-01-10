import { cuid } from '@paralleldrive/cuid2';

/**
 * Comment ID Value Object
 *
 * Type-safe identifier for Comment aggregates.
 */
export class CommentId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  static generate(): CommentId {
    return new CommentId(cuid());
  }

  static fromString(value: string): CommentId {
    return new CommentId(value);
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('CommentId cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: CommentId): boolean {
    if (!(other instanceof CommentId)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
