import { PageInfo, PaginationResponse } from '@application/shared/dto/pagination.dto';
import { CommunityAggregate } from '@domain/community/community/community.aggregate';
import { CommunityRepository } from '@domain/community/community/community.repository';
import { CanFollowCommunityPolicy } from '@domain/community/community/policies/can-follow-community.policy';
import { CanManageCommunityPolicy } from '@domain/community/community/policies/can-manage-community.policy';
import { CommunityName } from '@domain/community/community/value-objects/community-name.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  CommunityResponseDto,
  CreateCommunityDto,
  UpdateCommunityDto,
} from './dto';

/**
 * Community Application Service
 *
 * Orchestrates community use cases.
 *
 * Responsibilities:
 * - Coordinate policies, repositories, and domain logic
 * - Map between DTOs and domain aggregates
 * - Handle application-level concerns
 *
 * Pattern:
 * 1. Check policy
 * 2. Load aggregate
 * 3. Execute business logic
 * 4. Persist
 * 5. Return DTO
 */
@Injectable()
export class CommunityApplicationService {
  constructor(
    @Inject('CommunityRepository')
    private readonly communityRepository: CommunityRepository,
    private readonly canManageCommunity: CanManageCommunityPolicy,
    private readonly canFollowCommunity: CanFollowCommunityPolicy,
  ) {}

  /**
   * Create new community
   */
  async createCommunity(
    dto: CreateCommunityDto,
  ): Promise<CommunityResponseDto> {
    // Check if name already exists
    const nameExists = await this.communityRepository.existsByName(
      CommunityName.create(dto.name),
    );

    if (nameExists) {
      throw new Error('Community name already exists');
    }

    // Create aggregate
    const community = CommunityAggregate.create({
      name: dto.name,
      type: dto.type,
      description: dto.description,
    });

    // Persist
    await this.communityRepository.save(community);

    // Return DTO
    return this.mapToDto(community);
  }

  /**
   * Get community by ID
   */
  async getCommunity(communityId: string): Promise<CommunityResponseDto> {
    const community = await this.communityRepository.findById(
      CommunityId.fromString(communityId),
    );

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    return this.mapToDto(community);
  }

  /**
   * Update community profile
   */
  async updateCommunity(
    requesterId: string,
    communityId: string,
    dto: UpdateCommunityDto,
  ): Promise<CommunityResponseDto> {
    // 1. Check policy
    await this.canManageCommunity.check(requesterId, communityId);

    // 2. Load aggregate
    const community = await this.communityRepository.findById(
      CommunityId.fromString(communityId),
    );

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if new name already exists
    if (dto.name && dto.name !== community.name.value) {
      const nameExists = await this.communityRepository.existsByName(
        CommunityName.create(dto.name),
        community.id,
      );

      if (nameExists) {
        throw new Error('Community name already exists');
      }
    }

    // 3. Execute business logic
    community.updateProfile({
      name: dto.name,
      description: dto.description,
      avatarUrl: dto.avatarUrl,
      backgroundUrl: dto.backgroundUrl,
    });

    // 4. Persist
    await this.communityRepository.save(community);

    // 5. Return DTO
    return this.mapToDto(community);
  }

  /**
   * Follow community
   */
  async followCommunity(userId: string, communityId: string): Promise<void> {
    // 1. Check policy
    await this.canFollowCommunity.check(userId, communityId);

    // 2. Load aggregate
    const community = await this.communityRepository.findById(
      CommunityId.fromString(communityId),
    );

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // 3. Execute business logic
    community.follow(userId);

    // 4. Persist
    await this.communityRepository.save(community);
  }

  /**
   * Unfollow community
   */
  async unfollowCommunity(userId: string, communityId: string): Promise<void> {
    // Load aggregate
    const community = await this.communityRepository.findById(
      CommunityId.fromString(communityId),
    );

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Execute business logic
    community.unfollow(userId);

    // Persist
    await this.communityRepository.save(community);
  }

  /**
   * Bulk follow multiple communities
   *
   * Used for "Choose Community" onboarding flow.
   * Follows multiple communities in a single optimized batch operation.
   *
   * Performance optimization:
   * - Single query to fetch all communities
   * - Single query to check existing follows
   * - Skip already followed communities
   * - Process remaining in batch
   *
   * @param userId - User ID
   * @param communityIds - Array of community IDs to follow
   * @returns Object with success count and any failures
   */
  async bulkFollowCommunities(
    userId: string,
    communityIds: string[],
  ): Promise<{
    succeeded: number;
    failed: number;
    errors: Array<{ communityId: string; error: string }>;
  }> {
    const results = {
      succeeded: 0,
      failed: 0,
      errors: [] as Array<{ communityId: string; error: string }>,
    };

    if (communityIds.length === 0) {
      return results;
    }

    try {
      // STEP 1: Batch fetch all communities in one query (without followers for performance)
      const communities = await this.communityRepository.findByIds(communityIds);
      const foundCommunityIds = new Set(communities.map((c) => c.id.value));

      // Track communities that don't exist
      for (const communityId of communityIds) {
        if (!foundCommunityIds.has(communityId)) {
          results.failed++;
          results.errors.push({
            communityId,
            error: 'Community not found',
          });
        }
      }

      // STEP 2: Check which communities user already follows (single query)
      const alreadyFollowing = await this.communityRepository.checkAlreadyFollowing(
        userId,
        communities.map((c) => c.id.value),
      );

      // STEP 3: Process valid communities that aren't already followed
      for (const community of communities) {
        try {
          // Check if community is active
          if (!community.isActive || community.isDeleted) {
            results.failed++;
            results.errors.push({
              communityId: community.id.value,
              error: 'Cannot follow inactive or deleted community',
            });
            continue;
          }

          // Skip if already following
          if (alreadyFollowing.has(community.id.value)) {
            results.failed++;
            results.errors.push({
              communityId: community.id.value,
              error: 'Already following this community',
            });
            continue;
          }

          // Execute business logic
          community.follow(userId);

          // Persist
          await this.communityRepository.save(community);

          results.succeeded++;
        } catch (error) {
          results.failed++;
          results.errors.push({
            communityId: community.id.value,
            error: error.message || 'Unknown error',
          });
        }
      }
    } catch (error) {
      // If entire operation fails, mark all as failed
      for (const communityId of communityIds) {
        results.failed++;
        results.errors.push({
          communityId,
          error: error.message || 'Bulk operation failed',
        });
      }
    }

    return results;
  }

  /**
   * Get communities followed by user
   */
  async getFollowedCommunities(
    userId: string,
  ): Promise<CommunityResponseDto[]> {
    const communities = await this.communityRepository.findFollowedByUser(
      UserId.fromString(userId),
    );

    return communities.map((c) => this.mapToDto(c));
  }

  /**
   * Get all communities with pagination
   *
   * @param params - Pagination and filter parameters
   * @param params.userId - Optional user ID to check following status
   */
  async getAllCommunities(params: {
    page: number;
    limit: number;
    type?: string;
    searchTerm?: string;
    userId?: string;
  }): Promise<PaginationResponse<CommunityResponseDto>> {
    const result = await this.communityRepository.findAll({
      page: params.page,
      limit: params.limit,
      type: params.type,
      isActive: true,
      searchTerm: params.searchTerm,
    });

    const data = result.communities.map((c) => this.mapToDto(c, params.userId));
    const paging = new PageInfo(params.page, params.limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Delete community
   */
  async deleteCommunity(
    requesterId: string,
    communityId: string,
  ): Promise<void> {
    // Check policy
    await this.canManageCommunity.check(requesterId, communityId);

    // Load aggregate
    const community = await this.communityRepository.findById(
      CommunityId.fromString(communityId),
    );

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Execute business logic
    community.delete();

    // Persist
    await this.communityRepository.save(community);
  }

  /**
   * Map aggregate to DTO
   *
   * @param community - Community aggregate
   * @param userId - Optional user ID to check following status
   */
  private mapToDto(
    community: CommunityAggregate,
    userId?: string,
  ): CommunityResponseDto {
    const dto: CommunityResponseDto = {
      id: community.id.value,
      name: community.name.value,
      type: community.type.value,
      description: community.description,
      avatarUrl: community.avatarUrl,
      backgroundUrl: community.backgroundUrl,
      followerCount: community.followerCount,
      postCount: community.postCount,
      isActive: community.isActive,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
    };

    // Add isFollowed field if userId is provided
    if (userId) {
      const followers = community.getFollowers();
      dto.isFollowed = followers.some((f) => f.userId.value === userId);
    }

    return dto;
  }
}
