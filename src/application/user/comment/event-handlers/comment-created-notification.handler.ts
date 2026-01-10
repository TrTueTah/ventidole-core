import { DomainEvent } from '@core/event/domain-event.base';
import { IEventHandler } from '@core/event/event-handler.interface';
import { CommentCreatedEvent } from '@domain/content/comment/events/comment-created.event';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Comment Created Notification Handler
 *
 * Handles side effects when a new comment is created.
 *
 * Responsibilities:
 * - Send notification to post author
 * - Send notification to parent comment author (if reply)
 * - Track analytics event
 *
 * Note: Event handlers belong in the APPLICATION layer, not domain.
 * They handle SIDE EFFECTS (notifications, integrations, etc.)
 */
@Injectable()
export class CommentCreatedNotificationHandler implements IEventHandler {
  private readonly logger = new Logger(CommentCreatedNotificationHandler.name);

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof CommentCreatedEvent)) {
      return;
    }

    this.logger.log(
      `Handling CommentCreatedEvent for comment: ${event.commentId} by author: ${event.authorId}`,
    );

    try {
      // TODO: Send notification to post author
      await this.notifyPostAuthor(
        event.commentId,
        event.authorId,
        event.postId,
      );

      // TODO: If reply, send notification to parent comment author
      if (event.parentCommentId) {
        await this.notifyParentCommentAuthor(
          event.commentId,
          event.authorId,
          event.parentCommentId,
        );
      }

      // TODO: Track analytics
      await this.trackCommentCreation(
        event.commentId,
        event.authorId,
        event.postId,
        event.parentCommentId,
      );

      this.logger.log(
        `Successfully processed comment creation: ${event.commentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process comment creation: ${event.commentId}`,
        error,
      );
      // Note: We don't throw here - event handlers should be resilient
      // Failed handlers should not break the main flow
    }
  }

  private async notifyPostAuthor(
    commentId: string,
    authorId: string,
    postId: string,
  ): Promise<void> {
    // TODO: Send notification via Knock
    this.logger.log(
      `Notifying post author about new comment: ${commentId} on post: ${postId}`,
    );
  }

  private async notifyParentCommentAuthor(
    commentId: string,
    authorId: string,
    parentCommentId: string,
  ): Promise<void> {
    // TODO: Send notification via Knock
    this.logger.log(
      `Notifying parent comment ${parentCommentId} author about reply: ${commentId}`,
    );
  }

  private async trackCommentCreation(
    commentId: string,
    authorId: string,
    postId: string,
    parentCommentId: string | null,
  ): Promise<void> {
    // TODO: Track creation event in analytics
    this.logger.log(
      `Tracking comment creation: ${commentId} (isReply: ${!!parentCommentId})`,
    );
  }
}
