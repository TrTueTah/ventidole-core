import { CommentAggregate } from './comment.aggregate';
import { CommentId } from '@domain/shared/value-objects/comment-id.vo';
import { PostId } from '@domain/shared/value-objects/post-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';

/**
 * Comment Repository Interface
 *
 * Defines persistence operations for Comment aggregate.
 *
 * Note: This is a PURE INTERFACE - no implementation details.
 * Implementation will be in infrastructure layer (Prisma).
 */
export interface CommentRepository {
  /**
   * Save (create or update) a comment
   */
  save(comment: CommentAggregate): Promise<void>;

  /**
   * Find comment by ID
   */
  findById(id: CommentId): Promise<CommentAggregate | null>;

  /**
   * Find comments by post
   */
  findByPost(
    postId: PostId,
    params: { page: number; limit: number },
  ): Promise<{ comments: CommentAggregate[]; total: number }>;

  /**
   * Find replies to a comment
   */
  findReplies(
    parentCommentId: CommentId,
    params: { page: number; limit: number },
  ): Promise<{ comments: CommentAggregate[]; total: number }>;

  /**
   * Find comments by author
   */
  findByAuthor(
    authorId: UserId,
    params: { page: number; limit: number },
  ): Promise<{ comments: CommentAggregate[]; total: number }>;

  /**
   * Delete comment (soft delete)
   */
  delete(id: CommentId): Promise<void>;
}
