/**
 * Post Media Entity
 *
 * Represents a single media item (image/video) attached to a post.
 *
 * Business rules:
 * - Each media item has a URL
 * - Media items have a display order
 */
export class PostMedia {
  private readonly _url: string;
  private readonly _order: number;
  private readonly _createdAt: Date;

  private constructor(props: { url: string; order: number; createdAt: Date }) {
    this._url = props.url;
    this._order = props.order;
    this._createdAt = props.createdAt;
  }

  /**
   * Factory method: Create new media item
   */
  static create(url: string, order: number): PostMedia {
    if (!url || url.trim().length === 0) {
      throw new Error('Media URL cannot be empty');
    }

    if (order < 0) {
      throw new Error('Media order cannot be negative');
    }

    return new PostMedia({
      url,
      order,
      createdAt: new Date(),
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static fromPersistence(props: {
    url: string;
    order: number;
    createdAt: Date;
  }): PostMedia {
    return new PostMedia(props);
  }

  // Getters
  get url(): string {
    return this._url;
  }

  get order(): number {
    return this._order;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
