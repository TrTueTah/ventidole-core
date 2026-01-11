import { Module } from '@nestjs/common';
import { SubscriptionController } from './subscription.controller';
import { SubscriptionApplicationService } from './subscription.service';
import { SubscriptionRepositoryPrisma } from '@infra/prisma/membership/subscription.repository.prisma';
import { MembershipTierRepositoryPrisma } from '@infra/prisma/membership/membership-tier.repository.prisma';
import { PrismaService } from '@infra/prisma/prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { CanManageCommunityPolicy } from '@domain/community/community/policies';
import { CanAccessPremiumContentPolicy } from '@domain/membership/subscription/policies/can-access-premium-content.policy';
import { PayOSService } from '@infra/payos/payos.service';

/**
 * Subscription Module
 *
 * NestJS module for subscription functionality.
 *
 * Wires together:
 * - Controllers (HTTP layer)
 * - Application Services (use case orchestration)
 * - Repositories (persistence)
 * - Policies (authorization)
 */
@Module({
  controllers: [SubscriptionController],
  providers: [
    // Application Services
    SubscriptionApplicationService,

    // Infrastructure (Repository implementations)
    {
      provide: 'SubscriptionRepository',
      useClass: SubscriptionRepositoryPrisma,
    },
    {
      provide: 'MembershipTierRepository',
      useClass: MembershipTierRepositoryPrisma,
    },
    PrismaService,
    EventBus,

    // Payment Gateway
    PayOSService,

    // Policies
    CanManageCommunityPolicy,
    CanAccessPremiumContentPolicy,
  ],
  exports: [
    SubscriptionApplicationService,
    'SubscriptionRepository',
    CanAccessPremiumContentPolicy,
  ],
})
export class SubscriptionModule {}
