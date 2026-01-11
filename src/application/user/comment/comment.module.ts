import { Module, OnModuleInit } from '@nestjs/common';
import { CommentController } from './comment.controller';
import { CommentApplicationService } from './comment.service';
import { CommentRepositoryPrisma } from '@infra/prisma/content/comment/comment.repository.prisma';
import { PostRepositoryPrisma } from '@infra/prisma/content/post/post.repository.prisma';
import { PrismaService } from '@infra/prisma/prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import {
  CanViewCommentPolicy,
  CanEditCommentPolicy,
} from '@domain/content/comment/policies';
import { CommentCreatedNotificationHandler } from './event-handlers/comment-created-notification.handler';
import { KnockService } from '@infra/knock/knock.service';

/**
 * Comment Module
 *
 * NestJS module for comment functionality.
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
  controllers: [CommentController],
  providers: [
    // Application Services
    CommentApplicationService,

    // Infrastructure (Repository implementations)
    {
      provide: 'CommentRepository',
      useClass: CommentRepositoryPrisma,
    },
    {
      provide: 'PostRepository',
      useClass: PostRepositoryPrisma,
    },
    PrismaService,
    EventBus,
    KnockService,

    // Policies
    CanViewCommentPolicy,
    CanEditCommentPolicy,

    // Event Handlers
    CommentCreatedNotificationHandler,
  ],
  exports: [CommentApplicationService, 'CommentRepository'],
})
export class CommentModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly commentCreatedHandler: CommentCreatedNotificationHandler,
  ) {}

  onModuleInit() {
    // Register event handlers
    this.eventBus.subscribe(
      'CommentCreatedEvent',
      this.commentCreatedHandler,
    );
  }
}
