import { PostAggregate } from './post.aggregate';
import { PostId } from '@domain/shared/value-objects/post-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';

/**
 * Post Repository Interface
 *
 * Defines persistence operations for Post aggregate.
 *
 * Note: This is a PURE INTERFACE - no implementation details.
 * Implementation will be in infrastructure layer (Prisma).
 */
export interface PostRepository {
  /**
   * Save (create or update) a post
   */
  save(post: PostAggregate): Promise<void>;

  /**
   * Find post by ID
   */
  findById(id: PostId): Promise<PostAggregate | null>;

  /**
   * Find posts by author
   */
  findByAuthor(
    authorId: UserId,
    params: { page: number; limit: number },
  ): Promise<{ posts: PostAggregate[]; total: number }>;

  /**
   * Find posts by community
   */
  findByCommunity(
    communityId: CommunityId,
    params: { page: number; limit: number },
  ): Promise<{ posts: PostAggregate[]; total: number }>;

  /**
   * Find all posts with pagination and filters
   */
  findAll(params: {
    page: number;
    limit: number;
    authorId?: string;
    communityId?: string;
    searchTerm?: string;
  }): Promise<{
    posts: PostAggregate[];
    total: number;
  }>;

  /**
   * Find posts for feed (excluding deleted, ordered by creation)
   */
  findForFeed(params: {
    page: number;
    limit: number;
    userId?: string;
  }): Promise<{
    posts: PostAggregate[];
    total: number;
  }>;

  /**
   * Delete post (soft delete)
   */
  delete(id: PostId): Promise<void>;
}
