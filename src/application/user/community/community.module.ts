import { Module, OnModuleInit } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityApplicationService } from './community.service';
import { CommunityRepositoryPrisma } from '@infra/prisma/community/community/community.repository.prisma';
import { PrismaService } from '@infra/prisma/prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import {
  CanManageCommunityPolicy,
  CanFollowCommunityPolicy,
} from '@domain/community/community/policies';
import { CommunityCreatedNotificationHandler } from './event-handlers/community-created-notification.handler';

/**
 * Community Module
 *
 * NestJS module for community functionality.
 *
 * Wires together:
 * - Controllers (HTTP layer)
 * - Application Services (use case orchestration)
 * - Domain Services (business logic)
 * - Repositories (persistence)
 * - Policies (authorization)
 * - Event Handlers (side effects)
 */
@Module({
  controllers: [CommunityController],
  providers: [
    // Application Services
    CommunityApplicationService,

    // Infrastructure (Repository implementation)
    {
      provide: 'CommunityRepository',
      useClass: CommunityRepositoryPrisma,
    },
    PrismaService,
    EventBus,

    // Policies
    CanManageCommunityPolicy,
    CanFollowCommunityPolicy,

    // Event Handlers
    CommunityCreatedNotificationHandler,
  ],
  exports: [CommunityApplicationService, 'CommunityRepository'],
})
export class CommunityModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly communityCreatedHandler: CommunityCreatedNotificationHandler,
  ) {}

  onModuleInit() {
    // Register event handlers
    this.eventBus.subscribe(
      'CommunityCreatedEvent',
      this.communityCreatedHandler,
    );
  }
}
