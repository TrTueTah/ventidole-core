import { Module, OnModuleInit } from '@nestjs/common';
import { ProfileController } from './profile.controller';
import { ProfileApplicationService } from './profile.service';
import { UserRepositoryPrisma } from '@infra/prisma/identity/user/user.repository.prisma';
import { PrismaService } from '@infra/prisma/prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import {
  CanUpdateProfilePolicy,
  CanChangeRolePolicy,
  CanDeactivateUserPolicy,
} from '@domain/identity/user/policies';
import { UserRegisteredNotificationHandler } from './event-handlers/user-registered-notification.handler';

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

    // Policies
    CanUpdateProfilePolicy,
    CanChangeRolePolicy,
    CanDeactivateUserPolicy,

    // Event Handlers
    UserRegisteredNotificationHandler,
  ],
  exports: [
    ProfileApplicationService,
    'UserRepository',
  ],
})
export class ProfileModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly userRegisteredHandler: UserRegisteredNotificationHandler,
  ) {}

  onModuleInit() {
    // Register event handlers
    this.eventBus.subscribe('UserRegisteredEvent', this.userRegisteredHandler);
  }
}
