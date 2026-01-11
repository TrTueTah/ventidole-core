import { CommunityRepository } from '@domain/community/community/community.repository';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { Inject, Injectable } from '@nestjs/common';

/**
 * Post Domain Service
 *
 * Contains cross-aggregate business logic for posts.
 *
 * This is a PURE domain service - NO infrastructure dependencies.
 * It coordinates between Post and Community aggregates.
 */
@Injectable()
export class PostDomainService {
  constructor(
    @Inject('CommunityRepository')
    private readonly communityRepository: CommunityRepository,
  ) {}

  /**
   * Check if user can post in a community
   *
   * Business rules:
   * - SOLO communities: Only owner can post
   * - GROUP communities: Only followers can post
   * - Community must be active
   */
  async canUserPostInCommunity(
    userId: UserId,
    communityId: CommunityId,
  ): Promise<boolean> {
    const community = await this.communityRepository.findById(communityId);

    if (!community) {
      throw new Error('Community not found');
    }

    if (!community.isActive || community.isDeleted) {
      throw new Error('Cannot post in inactive or deleted community');
    }

    // SOLO communities: Only owner can post
    if (community.type.isSolo()) {
      return community.isOwnedBy(userId);
    }

    // GROUP communities: Only followers can post
    return community.hasFollower(userId);
  }
}
