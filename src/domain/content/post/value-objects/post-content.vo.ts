/**
 * Post Content Value Object
 *
 * Represents the textual content of a post.
 *
 * Business rules:
 * - Cannot exceed 5000 characters
 * - Can be empty (e.g., image-only posts)
 */
export class PostContent {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  static create(value: string): PostContent {
    return new PostContent(value);
  }

  static empty(): PostContent {
    return new PostContent('');
  }

  private validate(value: string): void {
    if (value.length > 5000) {
      throw new Error('Post content cannot exceed 5000 characters');
    }
  }

  get value(): string {
    return this._value;
  }

  isEmpty(): boolean {
    return this._value.trim().length === 0;
  }

  equals(other: PostContent): boolean {
    if (!(other instanceof PostContent)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
