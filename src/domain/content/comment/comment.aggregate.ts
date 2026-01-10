import { DomainEvent } from '@core/event/domain-event.base';
import { CommentId } from '@domain/shared/value-objects/comment-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { PostId } from '@domain/shared/value-objects/post-id.vo';
import { CommentContent } from './value-objects/comment-content.vo';
import { CommentCreatedEvent, CommentDeletedEvent } from './events';

/**
 * Comment Aggregate Root
 *
 * Represents a user comment on a post (with optional parent for threading).
 *
 * Business Rules (Invariants):
 * - Comment must belong to a post
 * - Comment must have an author
 * - Comment content cannot be empty
 * - Comment can have a parent (for replies/threading)
 * - Reply count cannot be negative
 * - Cannot modify deleted comments
 * - Soft delete only (isDeleted flag)
 *
 * Aggregate Boundary:
 * - Comment (root)
 */
export class CommentAggregate {
  private readonly _id: CommentId;
  private readonly _postId: PostId;
  private readonly _authorId: UserId;
  private readonly _parentCommentId: CommentId | null;
  private _content: CommentContent;
  private _replyCount: number;
  private _isDeleted: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(props: {
    id: CommentId;
    postId: PostId;
    authorId: UserId;
    parentCommentId: CommentId | null;
    content: CommentContent;
    replyCount: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._postId = props.postId;
    this._authorId = props.authorId;
    this._parentCommentId = props.parentCommentId;
    this._content = props.content;
    this._replyCount = props.replyCount;
    this._isDeleted = props.isDeleted;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._domainEvents = [];
  }

  /**
   * Factory method: Create new comment
   */
  static create(props: {
    postId: string;
    authorId: string;
    content: string;
    parentCommentId?: string;
  }): CommentAggregate {
    const comment = new CommentAggregate({
      id: CommentId.generate(),
      postId: PostId.fromString(props.postId),
      authorId: UserId.fromString(props.authorId),
      parentCommentId: props.parentCommentId
        ? CommentId.fromString(props.parentCommentId)
        : null,
      content: CommentContent.create(props.content),
      replyCount: 0,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    comment.addDomainEvent(
      new CommentCreatedEvent(
        comment._id.value,
        comment._authorId.value,
        comment._postId.value,
        comment._parentCommentId?.value || null,
      ),
    );

    return comment;
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static fromPersistence(props: {
    id: string;
    postId: string;
    authorId: string;
    parentCommentId: string | null;
    content: string;
    replyCount: number;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): CommentAggregate {
    return new CommentAggregate({
      id: CommentId.fromString(props.id),
      postId: PostId.fromString(props.postId),
      authorId: UserId.fromString(props.authorId),
      parentCommentId: props.parentCommentId
        ? CommentId.fromString(props.parentCommentId)
        : null,
      content: CommentContent.create(props.content),
      replyCount: props.replyCount,
      isDeleted: props.isDeleted,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Business method: Update comment content
   */
  updateContent(newContent: string): void {
    // Invariant: Cannot update deleted comment
    if (this._isDeleted) {
      throw new Error('Cannot update deleted comment');
    }

    this._content = CommentContent.create(newContent);
    this._updatedAt = new Date();
  }

  /**
   * Business method: Increment reply count
   */
  incrementReplyCount(): void {
    if (this._isDeleted) {
      return;
    }

    this._replyCount++;
    this._updatedAt = new Date();
  }

  /**
   * Business method: Decrement reply count
   */
  decrementReplyCount(): void {
    if (this._replyCount > 0) {
      this._replyCount--;
      this._updatedAt = new Date();
    }
  }

  /**
   * Business method: Delete comment (soft delete)
   */
  delete(): void {
    if (this._isDeleted) {
      return;
    }

    this._isDeleted = true;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new CommentDeletedEvent(this._id.value, this._postId.value),
    );
  }

  /**
   * Query method: Check if user is author
   */
  isAuthoredBy(userId: UserId): boolean {
    return this._authorId.equals(userId);
  }

  /**
   * Query method: Check if comment is a reply
   */
  isReply(): boolean {
    return this._parentCommentId !== null;
  }

  // Getters
  get id(): CommentId {
    return this._id;
  }

  get postId(): PostId {
    return this._postId;
  }

  get authorId(): UserId {
    return this._authorId;
  }

  get parentCommentId(): CommentId | null {
    return this._parentCommentId;
  }

  get content(): CommentContent {
    return this._content;
  }

  get replyCount(): number {
    return this._replyCount;
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
