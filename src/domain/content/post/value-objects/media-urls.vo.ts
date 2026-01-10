/**
 * Media URLs Value Object
 *
 * Represents a collection of media URLs (images/videos) for a post.
 *
 * Business rules:
 * - Maximum 10 media items per post
 * - Each URL must be valid
 */
export class MediaUrls {
  private readonly _urls: ReadonlyArray<string>;

  private constructor(urls: string[]) {
    this.validate(urls);
    this._urls = Object.freeze([...urls]);
  }

  static create(urls: string[]): MediaUrls {
    return new MediaUrls(urls);
  }

  static empty(): MediaUrls {
    return new MediaUrls([]);
  }

  private validate(urls: string[]): void {
    if (urls.length > 10) {
      throw new Error('Post cannot have more than 10 media items');
    }

    for (const url of urls) {
      if (!url || url.trim().length === 0) {
        throw new Error('Media URL cannot be empty');
      }

      if (url.length > 500) {
        throw new Error('Media URL cannot exceed 500 characters');
      }
    }
  }

  get urls(): ReadonlyArray<string> {
    return this._urls;
  }

  get count(): number {
    return this._urls.length;
  }

  isEmpty(): boolean {
    return this._urls.length === 0;
  }

  equals(other: MediaUrls): boolean {
    if (!(other instanceof MediaUrls)) {
      return false;
    }

    if (this._urls.length !== other._urls.length) {
      return false;
    }

    return this._urls.every((url, index) => url === other._urls[index]);
  }

  toString(): string {
    return this._urls.join(', ');
  }
}
