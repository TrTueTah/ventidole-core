import { Inject, Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { MembershipTierRepository } from '@domain/membership/membership-tier/membership-tier.repository';
import { MembershipTierAggregate } from '@domain/membership/membership-tier/membership-tier.aggregate';
import { MembershipTierId } from '@domain/shared/value-objects/membership-tier-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { Money } from '@domain/commerce/order/value-objects/money.vo';
import { CanManageCommunityPolicy } from '@domain/community/community/policies/can-manage-community.policy';
import {
  CreateTierDto,
  UpdateTierPricingDto,
  UpdateTierDetailsDto,
  TierResponseDto,
} from './dto';

/**
 * MembershipTier Application Service
 *
 * Orchestrates membership tier use cases.
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
export class MembershipTierApplicationService {
  constructor(
    @Inject('MembershipTierRepository')
    private readonly tierRepository: MembershipTierRepository,
    private readonly canManageCommunity: CanManageCommunityPolicy,
  ) {}

  /**
   * Create membership tier for a community
   * Only community owner can create tier
   */
  async createTier(
    requesterId: string,
    dto: CreateTierDto,
  ): Promise<TierResponseDto> {
    // 1. Check policy - only community owner can create tier
    await this.canManageCommunity.check(requesterId, dto.communityId);

    // 2. Check if community already has a tier
    const existingTier = await this.tierRepository.findByCommunity(
      CommunityId.fromString(dto.communityId),
    );

    if (existingTier) {
      throw new Error('Community already has a membership tier');
    }

    // 3. Create aggregate
    const tier = MembershipTierAggregate.create({
      communityId: dto.communityId,
      name: dto.name,
      description: dto.description,
      monthlyPrice: dto.monthlyPrice,
      yearlyPrice: dto.yearlyPrice,
    });

    // 4. Persist
    await this.tierRepository.save(tier);

    // 5. Return DTO
    return this.mapToDto(tier);
  }

  /**
   * Update tier pricing
   * Only community owner can update pricing
   */
  async updateTierPricing(
    requesterId: string,
    tierId: string,
    dto: UpdateTierPricingDto,
  ): Promise<TierResponseDto> {
    // 1. Load aggregate
    const tier = await this.tierRepository.findById(
      MembershipTierId.fromString(tierId),
    );

    if (!tier) {
      throw new NotFoundException('Membership tier not found');
    }

    // 2. Check policy
    await this.canManageCommunity.check(requesterId, tier.communityId.value);

    // 3. Execute business logic
    tier.updatePricing(
      Money.fromAmount(dto.monthlyPrice),
      Money.fromAmount(dto.yearlyPrice),
    );

    // 4. Persist
    await this.tierRepository.save(tier);

    // 5. Return DTO
    return this.mapToDto(tier);
  }

  /**
   * Update tier details (name, description)
   * Only community owner can update details
   */
  async updateTierDetails(
    requesterId: string,
    tierId: string,
    dto: UpdateTierDetailsDto,
  ): Promise<TierResponseDto> {
    // 1. Load aggregate
    const tier = await this.tierRepository.findById(
      MembershipTierId.fromString(tierId),
    );

    if (!tier) {
      throw new NotFoundException('Membership tier not found');
    }

    // 2. Check policy
    await this.canManageCommunity.check(requesterId, tier.communityId.value);

    // 3. Execute business logic
    tier.updateDetails(dto.name, dto.description || null);

    // 4. Persist
    await this.tierRepository.save(tier);

    // 5. Return DTO
    return this.mapToDto(tier);
  }

  /**
   * Get tier by community ID
   */
  async getTierByCommunity(communityId: string): Promise<TierResponseDto | null> {
    const tier = await this.tierRepository.findByCommunity(
      CommunityId.fromString(communityId),
    );

    if (!tier) {
      return null;
    }

    return this.mapToDto(tier);
  }

  /**
   * Deactivate tier
   * Only community owner can deactivate
   */
  async deactivateTier(requesterId: string, tierId: string): Promise<void> {
    // 1. Load aggregate
    const tier = await this.tierRepository.findById(
      MembershipTierId.fromString(tierId),
    );

    if (!tier) {
      throw new NotFoundException('Membership tier not found');
    }

    // 2. Check policy
    await this.canManageCommunity.check(requesterId, tier.communityId.value);

    // 3. Execute business logic
    tier.deactivate();

    // 4. Persist
    await this.tierRepository.save(tier);
  }

  /**
   * Activate tier
   * Only community owner can activate
   */
  async activateTier(requesterId: string, tierId: string): Promise<void> {
    // 1. Load aggregate
    const tier = await this.tierRepository.findById(
      MembershipTierId.fromString(tierId),
    );

    if (!tier) {
      throw new NotFoundException('Membership tier not found');
    }

    // 2. Check policy
    await this.canManageCommunity.check(requesterId, tier.communityId.value);

    // 3. Execute business logic
    tier.activate();

    // 4. Persist
    await this.tierRepository.save(tier);
  }

  /**
   * Map aggregate to DTO
   */
  private mapToDto(tier: MembershipTierAggregate): TierResponseDto {
    return {
      id: tier.id.value,
      communityId: tier.communityId.value,
      name: tier.name.value,
      description: tier.description,
      monthlyPrice: tier.getMonthlyPrice().amount,
      yearlyPrice: tier.getYearlyPrice().amount,
      currency: 'VND',
      yearlyDiscount: tier.getYearlyDiscount(),
      subscriberCount: tier.subscriberCount,
      isActive: tier.isActive,
      createdAt: tier.createdAt,
    };
  }
}
