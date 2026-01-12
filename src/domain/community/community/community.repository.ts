import { CommunityAggregate } from './community.aggregate';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CommunityName } from './value-objects/community-name.vo';

/**
 * Community Repository Interface
 *
 * Defines persistence operations for Community aggregate.
 *
 * Note: This is a PURE INTERFACE - no implementation details.
 * Implementation will be in infrastructure layer (Prisma).
 */
export interface CommunityRepository {
  /**
   * Save (create or update) a community
   */
  save(community: CommunityAggregate): Promise<void>;

  /**
   * Find community by ID
   */
  findById(id: CommunityId): Promise<CommunityAggregate | null>;

  /**
   * Find multiple communities by IDs (bulk operation)
   */
  findByIds(ids: string[]): Promise<CommunityAggregate[]>;

  /**
   * Find community by name
   */
  findByName(name: CommunityName): Promise<CommunityAggregate | null>;

  /**
   * Check if community name exists (for uniqueness validation)
   */
  existsByName(name: CommunityName, excludeId?: CommunityId): Promise<boolean>;

  /**
   * Find communities that a user follows
   */
  findFollowedByUser(userId: UserId): Promise<CommunityAggregate[]>;

  /**
   * Check which communities from the list the user is already following
   * Returns a Set of community IDs that are already followed
   */
  checkAlreadyFollowing(userId: string, communityIds: string[]): Promise<Set<string>>;

  /**
   * Find all communities with pagination and filters
   */
  findAll(params: {
    page: number;
    limit: number;
    type?: string;
    isActive?: boolean;
    searchTerm?: string;
  }): Promise<{
    communities: CommunityAggregate[];
    total: number;
  }>;

  /**
   * Delete community (soft delete)
   */
  delete(id: CommunityId): Promise<void>;
}
