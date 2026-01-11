import { DomainEvent } from '@core/event/domain-event.base';
import { IEventHandler } from '@core/event/event-handler.interface';
import { CommentCreatedEvent } from '@domain/content/comment/events/comment-created.event';
import { KnockService } from '@infra/knock/knock.service';
import { PrismaService } from '@infra/prisma/prisma.service';
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

  constructor(
    private readonly knockService: KnockService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof CommentCreatedEvent)) {
      return;
    }

    this.logger.log(
      `Handling CommentCreatedEvent for comment: ${event.commentId} by author: ${event.authorId}`,
    );

    try {
      // Send notification to post author
      await this.notifyPostAuthor(
        event.commentId,
        event.authorId,
        event.postId,
      );

      // If reply, send notification to parent comment author
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
    try {
      // Get post details and author
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: {
          id: true,
          content: true,
          authorId: true,
          author: { select: { id: true, username: true, email: true } },
        },
      });

      if (!post) {
        this.logger.warn(`Post not found: ${postId}`);
        return;
      }

      // Don't notify if commenter is the post author
      if (post.authorId === authorId) {
        return;
      }

      // Get comment details
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          content: true,
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      });

      if (!comment) {
        this.logger.warn(`Comment not found: ${commentId}`);
        return;
      }

      // Trigger Knock workflow
      await this.knockService.triggerWorkflow(
        'post-commented',
        [post.author.id],
        {
          postId: post.id,
          postContent: post.content?.substring(0, 100) || '',
          commentContent: comment.content.substring(0, 100),
          commenterName: comment.author.username,
          commenterAvatar: comment.author.avatarUrl,
          url: `/posts/${post.id}`,
        },
        {
          id: comment.author.id,
          name: comment.author.username,
          avatar: comment.author.avatarUrl,
        },
      );

      this.logger.log(`Notified post author about comment: ${commentId}`);
    } catch (error) {
      this.logger.error(
        `Failed to notify post author for comment ${commentId}:`,
        error,
      );
      throw error;
    }
  }

  private async notifyParentCommentAuthor(
    commentId: string,
    authorId: string,
    parentCommentId: string,
  ): Promise<void> {
    try {
      // Get parent comment details
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentCommentId },
        select: {
          authorId: true,
          content: true,
          author: { select: { id: true, username: true, email: true } },
          postId: true,
        },
      });

      if (!parentComment) {
        this.logger.warn(`Parent comment not found: ${parentCommentId}`);
        return;
      }

      // Don't notify if replier is the parent comment author
      if (parentComment.authorId === authorId) {
        return;
      }

      // Get reply details
      const reply = await this.prisma.comment.findUnique({
        where: { id: commentId },
        select: {
          content: true,
          author: {
            select: { id: true, username: true, avatarUrl: true },
          },
        },
      });

      if (!reply) {
        this.logger.warn(`Reply not found: ${commentId}`);
        return;
      }

      // Trigger Knock workflow (using post-commented workflow for replies too)
      await this.knockService.triggerWorkflow(
        'post-commented',
        [parentComment.author.id],
        {
          postId: parentComment.postId,
          postContent: parentComment.content.substring(0, 100),
          commentContent: reply.content.substring(0, 100),
          commenterName: reply.author.username,
          commenterAvatar: reply.author.avatarUrl,
          url: `/posts/${parentComment.postId}`,
        },
        {
          id: reply.author.id,
          name: reply.author.username,
          avatar: reply.author.avatarUrl,
        },
      );

      this.logger.log(
        `Notified parent comment author about reply: ${commentId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to notify parent comment author for reply ${commentId}:`,
        error,
      );
      throw error;
    }
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
