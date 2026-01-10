/**
 * Comment Content Value Object
 *
 * Represents the textual content of a comment.
 *
 * Business rules:
 * - Cannot be empty
 * - Cannot exceed 1000 characters
 */
export class CommentContent {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  static create(value: string): CommentContent {
    return new CommentContent(value);
  }

  private validate(value: string): void {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Comment content cannot be empty');
    }

    if (value.length > 1000) {
      throw new Error('Comment content cannot exceed 1000 characters');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: CommentContent): boolean {
    if (!(other instanceof CommentContent)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
