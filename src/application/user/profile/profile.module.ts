import { EventBus } from '@core/event/event-bus.service';
import {
  CanChangeRolePolicy,
  CanDeactivateUserPolicy,
  CanUpdateProfilePolicy,
} from '@domain/identity/user/policies';
import { KnockService } from '@infra/knock/knock.service';
import { UserRepositoryPrisma } from '@infra/prisma/identity/user/user.repository.prisma';
import { PrismaService } from '@infra/prisma/prisma.service';
import { StreamChatService } from '@infra/stream-chat/stream-chat.service';
import { Module, OnModuleInit } from '@nestjs/common';
import { UserProfileUpdatedSyncHandler } from './event-handlers/user-profile-updated-sync.handler';
import { UserRegisteredNotificationHandler } from './event-handlers/user-registered-notification.handler';
import { ProfileController } from './profile.controller';
import { ProfileApplicationService } from './profile.service';

/**
 * Profile Module
 *
 * NestJS module for user profile functionality.
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
  controllers: [ProfileController],
  providers: [
    // Application Services
    ProfileApplicationService,

    // Infrastructure (Repository implementation)
    {
      provide: 'UserRepository',
      useClass: UserRepositoryPrisma,
    },
    PrismaService,
    EventBus,
    KnockService,
    StreamChatService,

    // Policies
    CanUpdateProfilePolicy,
    CanChangeRolePolicy,
    CanDeactivateUserPolicy,

    // Event Handlers
    UserRegisteredNotificationHandler,
    UserProfileUpdatedSyncHandler,
  ],
  exports: [ProfileApplicationService, 'UserRepository'],
})
export class ProfileModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly userRegisteredHandler: UserRegisteredNotificationHandler,
    private readonly userProfileUpdatedHandler: UserProfileUpdatedSyncHandler,
  ) {}

  onModuleInit() {
    // Register event handlers
    this.eventBus.subscribe('UserRegisteredEvent', this.userRegisteredHandler);
    this.eventBus.subscribe(
      'UserProfileUpdatedEvent',
      this.userProfileUpdatedHandler,
    );
  }
}
