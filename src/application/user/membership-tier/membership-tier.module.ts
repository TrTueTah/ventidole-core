import { Module } from '@nestjs/common';
import { MembershipTierController } from './membership-tier.controller';
import { MembershipTierApplicationService } from './membership-tier.service';
import { MembershipTierRepositoryPrisma } from '@infra/prisma/membership/membership-tier.repository.prisma';
import { PrismaService } from '@infra/prisma/prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { CanManageCommunityPolicy } from '@domain/community/community/policies';

/**
 * MembershipTier Module
 *
 * NestJS module for membership tier functionality.
 *
 * Wires together:
 * - Controllers (HTTP layer)
 * - Application Services (use case orchestration)
 * - Repositories (persistence)
 * - Policies (authorization)
 */
@Module({
  controllers: [MembershipTierController],
  providers: [
    // Application Services
    MembershipTierApplicationService,

    // Infrastructure (Repository implementation)
    {
      provide: 'MembershipTierRepository',
      useClass: MembershipTierRepositoryPrisma,
    },
    PrismaService,
    EventBus,

    // Policies
    CanManageCommunityPolicy,
  ],
  exports: [MembershipTierApplicationService, 'MembershipTierRepository'],
})
export class MembershipTierModule {}
