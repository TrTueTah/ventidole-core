import { DomainEvent } from '@core/event/domain-event.base';
import { PostId } from '@domain/shared/value-objects/post-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { PostContent } from './value-objects/post-content.vo';
import { MediaUrls } from './value-objects/media-urls.vo';
import { PostMedia } from './entities/post-media.entity';
import {
  PostCreatedEvent,
  PostLikedEvent,
  PostUnlikedEvent,
  PostDeletedEvent,
} from './events';

/**
 * Post Aggregate Root
 *
 * Represents a user-generated post (with optional community).
 *
 * Business Rules (Invariants):
 * - Post must have an author
 * - Post can optionally belong to a community
 * - Post must have content OR media (at least one)
 * - Maximum 10 media items per post
 * - Like count cannot be negative
 * - View count cannot be negative
 * - Comment count cannot be negative
 * - Cannot modify deleted posts
 * - Soft delete only (isDeleted flag)
 *
 * Aggregate Boundary:
 * - Post (root)
 * - PostMedia (entity collection)
 */
export class PostAggregate {
  private readonly _id: PostId;
  private readonly _authorId: UserId;
  private readonly _communityId: CommunityId | null;
  private _content: PostContent;
  private _mediaItems: Map<number, PostMedia>; // order -> media
  private _likeCount: number;
  private _viewCount: number;
  private _commentCount: number;
  private _isDeleted: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(props: {
    id: PostId;
    authorId: UserId;
    communityId: CommunityId | null;
    content: PostContent;
    mediaItems: Map<number, PostMedia>;
    likeCount: number;
    viewCount: number;
    commentCount: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._authorId = props.authorId;
    this._communityId = props.communityId;
    this._content = props.content;
    this._mediaItems = props.mediaItems;
    this._likeCount = props.likeCount;
    this._viewCount = props.viewCount;
    this._commentCount = props.commentCount;
    this._isDeleted = props.isDeleted;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._domainEvents = [];
  }

  /**
   * Factory method: Create new post
   */
  static create(props: {
    authorId: string;
    communityId?: string;
    content: string;
    mediaUrls?: string[];
  }): PostAggregate {
    const content = PostContent.create(props.content);
    const mediaUrls = props.mediaUrls || [];

    // Invariant: Post must have content OR media
    if (content.isEmpty() && mediaUrls.length === 0) {
      throw new Error('Post must have content or media');
    }

    // Create media items
    const mediaItems = new Map<number, PostMedia>();
    mediaUrls.forEach((url, index) => {
      const media = PostMedia.create(url, index);
      mediaItems.set(index, media);
    });

    const post = new PostAggregate({
      id: PostId.generate(),
      authorId: UserId.fromString(props.authorId),
      communityId: props.communityId
        ? CommunityId.fromString(props.communityId)
        : null,
      content,
      mediaItems,
      likeCount: 0,
      viewCount: 0,
      commentCount: 0,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    post.addDomainEvent(
      new PostCreatedEvent(
        post._id.value,
        post._authorId.value,
        post._communityId?.value || null,
        mediaItems.size > 0,
      ),
    );

    return post;
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static fromPersistence(props: {
    id: string;
    authorId: string;
    communityId: string | null;
    content: string;
    likeCount: number;
    viewCount: number;
    commentCount: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    mediaItems?: Array<{ url: string; order: number; createdAt: Date }>;
  }): PostAggregate {
    const mediaItemsMap = new Map<number, PostMedia>();

    if (props.mediaItems) {
      for (const media of props.mediaItems) {
        const mediaEntity = PostMedia.fromPersistence(media);
        mediaItemsMap.set(media.order, mediaEntity);
      }
    }

    return new PostAggregate({
      id: PostId.fromString(props.id),
      authorId: UserId.fromString(props.authorId),
      communityId: props.communityId
        ? CommunityId.fromString(props.communityId)
        : null,
      content: PostContent.create(props.content),
      mediaItems: mediaItemsMap,
      likeCount: props.likeCount,
      viewCount: props.viewCount,
      commentCount: props.commentCount,
      isDeleted: props.isDeleted,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Business method: Update post content
   */
  updateContent(props: { content: string; mediaUrls?: string[] }): void {
    // Invariant: Cannot update deleted post
    if (this._isDeleted) {
      throw new Error('Cannot update deleted post');
    }

    const newContent = PostContent.create(props.content);
    const newMediaUrls = props.mediaUrls || [];

    // Invariant: Post must have content OR media
    if (newContent.isEmpty() && newMediaUrls.length === 0) {
      throw new Error('Post must have content or media');
    }

    this._content = newContent;

    // Update media items
    this._mediaItems.clear();
    newMediaUrls.forEach((url, index) => {
      const media = PostMedia.create(url, index);
      this._mediaItems.set(index, media);
    });

    this._updatedAt = new Date();
  }

  /**
   * Business method: Like post
   */
  like(userId: string): void {
    // Invariant: Cannot like deleted post
    if (this._isDeleted) {
      throw new Error('Cannot like deleted post');
    }

    this._likeCount++;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PostLikedEvent(this._id.value, userId, this._authorId.value),
    );
  }

  /**
   * Business method: Unlike post
   */
  unlike(userId: string): void {
    // Invariant: Cannot unlike if like count is already 0
    if (this._likeCount === 0) {
      throw new Error('Post has no likes to remove');
    }

    this._likeCount--;
    this._updatedAt = new Date();

    this.addDomainEvent(new PostUnlikedEvent(this._id.value, userId));
  }

  /**
   * Business method: Increment view count
   */
  incrementViewCount(): void {
    if (this._isDeleted) {
      return; // Silently ignore views on deleted posts
    }

    this._viewCount++;
    this._updatedAt = new Date();
  }

  /**
   * Business method: Increment comment count
   */
  incrementCommentCount(): void {
    if (this._isDeleted) {
      return;
    }

    this._commentCount++;
    this._updatedAt = new Date();
  }

  /**
   * Business method: Decrement comment count
   */
  decrementCommentCount(): void {
    if (this._commentCount > 0) {
      this._commentCount--;
      this._updatedAt = new Date();
    }
  }

  /**
   * Business method: Delete post (soft delete)
   */
  delete(): void {
    if (this._isDeleted) {
      return;
    }

    this._isDeleted = true;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new PostDeletedEvent(this._id.value, this._authorId.value),
    );
  }

  /**
   * Query method: Check if user is author
   */
  isAuthoredBy(userId: UserId): boolean {
    return this._authorId.equals(userId);
  }

  /**
   * Query method: Check if post belongs to community
   */
  belongsToCommunity(communityId: CommunityId): boolean {
    if (!this._communityId) {
      return false;
    }
    return this._communityId.equals(communityId);
  }

  /**
   * Query method: Check if post has media
   */
  hasMedia(): boolean {
    return this._mediaItems.size > 0;
  }

  /**
   * Query method: Get media items in order
   */
  getMediaItems(): ReadonlyArray<PostMedia> {
    return Array.from(this._mediaItems.values()).sort(
      (a, b) => a.order - b.order,
    );
  }

  // Getters
  get id(): PostId {
    return this._id;
  }

  get authorId(): UserId {
    return this._authorId;
  }

  get communityId(): CommunityId | null {
    return this._communityId;
  }

  get content(): PostContent {
    return this._content;
  }

  get likeCount(): number {
    return this._likeCount;
  }

  get viewCount(): number {
    return this._viewCount;
  }

  get commentCount(): number {
    return this._commentCount;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }
}
