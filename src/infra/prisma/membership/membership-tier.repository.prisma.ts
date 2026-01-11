import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { MembershipTierRepository } from '@domain/membership/membership-tier/membership-tier.repository';
import { MembershipTierAggregate } from '@domain/membership/membership-tier/membership-tier.aggregate';
import { MembershipTierId } from '@domain/shared/value-objects/membership-tier-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';

/**
 * MembershipTier Repository Prisma Implementation
 *
 * Implements MembershipTierRepository interface using Prisma ORM.
 *
 * Responsibilities:
 * - Map between domain aggregates and Prisma models
 * - Persist and retrieve membership tiers
 * - Publish domain events after persistence
 */
@Injectable()
export class MembershipTierRepositoryPrisma implements MembershipTierRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async save(tier: MembershipTierAggregate): Promise<void> {
    const data = this.toPersistence(tier);

    // Upsert tier
    await this.prisma.membershipTier.upsert({
      where: { id: data.id },
      create: data,
      update: {
        name: data.name,
        description: data.description,
        monthlyPrice: data.monthlyPrice,
        yearlyPrice: data.yearlyPrice,
        subscriberCount: data.subscriberCount,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
    });

    // Publish domain events
    const events = tier.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    tier.clearDomainEvents();
  }

  async findById(
    id: MembershipTierId,
  ): Promise<MembershipTierAggregate | null> {
    const tier = await this.prisma.membershipTier.findUnique({
      where: { id: id.value },
    });

    if (!tier) {
      return null;
    }

    return this.toDomain(tier);
  }

  async findByCommunity(
    communityId: CommunityId,
  ): Promise<MembershipTierAggregate | null> {
    const tier = await this.prisma.membershipTier.findUnique({
      where: { communityId: communityId.value },
    });

    if (!tier) {
      return null;
    }

    return this.toDomain(tier);
  }

  async existsByCommunity(communityId: CommunityId): Promise<boolean> {
    const count = await this.prisma.membershipTier.count({
      where: { communityId: communityId.value },
    });

    return count > 0;
  }

  /**
   * Map from Prisma model to domain aggregate
   */
  private toDomain(data: any): MembershipTierAggregate {
    return MembershipTierAggregate.fromPersistence({
      id: data.id,
      communityId: data.communityId,
      name: data.name,
      description: data.description,
      monthlyPrice: data.monthlyPrice,
      yearlyPrice: data.yearlyPrice,
      subscriberCount: data.subscriberCount,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Map from domain aggregate to Prisma model
   */
  private toPersistence(tier: MembershipTierAggregate): any {
    return {
      id: tier.id.value,
      communityId: tier.communityId.value,
      name: tier.name.value,
      description: tier.description,
      monthlyPrice: tier.getMonthlyPrice().amount,
      yearlyPrice: tier.getYearlyPrice().amount,
      currency: 'VND',
      subscriberCount: tier.subscriberCount,
      isActive: tier.isActive,
      createdAt: tier.createdAt,
      updatedAt: tier.updatedAt,
    };
  }
}
