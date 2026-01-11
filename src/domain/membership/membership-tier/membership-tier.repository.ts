import { MembershipTierAggregate } from './membership-tier.aggregate';
import { MembershipTierId } from '@domain/shared/value-objects/membership-tier-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';

/**
 * MembershipTier Repository Interface
 *
 * Domain layer contract for membership tier persistence.
 * Infrastructure layer must implement this interface.
 */
export interface MembershipTierRepository {
  /**
   * Persist membership tier (create or update)
   */
  save(tier: MembershipTierAggregate): Promise<void>;

  /**
   * Find membership tier by ID
   */
  findById(id: MembershipTierId): Promise<MembershipTierAggregate | null>;

  /**
   * Find membership tier by community ID
   * Business rule: One tier per community
   */
  findByCommunity(
    communityId: CommunityId,
  ): Promise<MembershipTierAggregate | null>;

  /**
   * Check if community already has a tier
   * Used to enforce "one tier per community" invariant
   */
  existsByCommunity(communityId: CommunityId): Promise<boolean>;
}
