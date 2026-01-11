import { Module, OnModuleInit } from '@nestjs/common';
import { PostController } from './post.controller';
import { PostApplicationService } from './post.service';
import { PostRepositoryPrisma } from '@infra/prisma/content/post/post.repository.prisma';
import { PrismaService } from '@infra/prisma/prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { PostDomainService } from '@domain/content/post/post.domain-service';
import {
  CanViewPostPolicy,
  CanEditPostPolicy,
  CanModeratePostPolicy,
} from '@domain/content/post/policies';
import { PostCreatedNotificationHandler } from './event-handlers/post-created-notification.handler';
import { CommunityRepositoryPrisma } from '@infra/prisma/community/community/community.repository.prisma';
import { KnockService } from '@infra/knock/knock.service';

/**
 * Post Module
 *
 * NestJS module for post functionality.
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
  controllers: [PostController],
  providers: [
    // Application Services
    PostApplicationService,

    // Domain Services
    PostDomainService,

    // Infrastructure (Repository implementations)
    {
      provide: 'PostRepository',
      useClass: PostRepositoryPrisma,
    },
    {
      provide: 'CommunityRepository',
      useClass: CommunityRepositoryPrisma,
    },
    PrismaService,
    EventBus,
    KnockService,

    // Policies
    CanViewPostPolicy,
    CanEditPostPolicy,
    CanModeratePostPolicy,

    // Event Handlers
    PostCreatedNotificationHandler,
  ],
  exports: [PostApplicationService, 'PostRepository'],
})
export class PostModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly postCreatedHandler: PostCreatedNotificationHandler,
  ) {}

  onModuleInit() {
    // Register event handlers
    this.eventBus.subscribe('PostCreatedEvent', this.postCreatedHandler);
  }
}
