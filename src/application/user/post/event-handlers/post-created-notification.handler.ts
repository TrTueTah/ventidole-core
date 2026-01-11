import { DomainEvent } from '@core/event/domain-event.base';
import { IEventHandler } from '@core/event/event-handler.interface';
import { PostCreatedEvent } from '@domain/content/post/events/post-created.event';
import { KnockService } from '@infra/knock/knock.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Post Created Notification Handler
 *
 * Handles side effects when a new post is created.
 *
 * Responsibilities:
 * - Send notifications to community followers
 * - Update recommendation engine
 * - Track analytics event
 * - Update user's post count
 *
 * Note: Event handlers belong in the APPLICATION layer, not domain.
 * They handle SIDE EFFECTS (notifications, integrations, etc.)
 */
@Injectable()
export class PostCreatedNotificationHandler implements IEventHandler {
  private readonly logger = new Logger(PostCreatedNotificationHandler.name);

  constructor(
    private readonly knockService: KnockService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof PostCreatedEvent)) {
      return;
    }

    this.logger.log(
      `Handling PostCreatedEvent for post: ${event.postId} by author: ${event.authorId}`,
    );

    try {
      // Send notifications to community followers
      if (event.communityId) {
        await this.notifyCommunityFollowers(
          event.postId,
          event.authorId,
          event.communityId,
        );
      }

      // TODO: Update recommendation engine
      await this.updateRecommendations(
        event.postId,
        event.authorId,
        event.hasMedia,
      );

      // TODO: Track analytics
      await this.trackPostCreation(
        event.postId,
        event.authorId,
        event.communityId,
        event.hasMedia,
      );

      this.logger.log(`Successfully processed post creation: ${event.postId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process post creation: ${event.postId}`,
        error,
      );
      // Note: We don't throw here - event handlers should be resilient
      // Failed handlers should not break the main flow
    }
  }

  private async notifyCommunityFollowers(
    postId: string,
    authorId: string,
    communityId: string,
  ): Promise<void> {
    try {
      // Get community details
      const community = await this.prisma.community.findUnique({
        where: { id: communityId },
        select: { id: true, name: true },
      });

      if (!community) {
        this.logger.warn(`Community not found: ${communityId}`);
        return;
      }

      // Get all followers except the author
      const followers = await this.prisma.communityFollower.findMany({
        where: {
          communityId,
          userId: { not: authorId },
          isActive: true,
        },
        select: {
          userId: true,
          user: { select: { id: true, username: true, email: true } },
        },
      });

      if (followers.length === 0) {
        this.logger.log('No followers to notify');
        return;
      }

      // Get author details
      const author = await this.prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true, username: true, avatarUrl: true },
      });

      if (!author) {
        this.logger.warn(`Author not found: ${authorId}`);
        return;
      }

      // Get post title for notification
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
        select: { content: true },
      });

      const postTitle = post?.content?.substring(0, 100) || 'New post';

      // Trigger Knock workflow
      await this.knockService.triggerWorkflow(
        'community-new-post',
        followers.map((f) => ({
          id: f.user.id,
          name: f.user.username,
          email: f.user.email,
        })),
        {
          communityId: community.id,
          communityName: community.name,
          postId,
          postTitle,
          authorName: author.username,
          authorAvatar: author.avatarUrl,
          url: `/communities/${community.id}/posts/${postId}`,
        },
        { id: author.id, name: author.username, avatar: author.avatarUrl },
      );

      this.logger.log(`Notified ${followers.length} followers about new post`);
    } catch (error) {
      this.logger.error(
        `Failed to notify followers for post ${postId}:`,
        error,
      );
      throw error;
    }
  }

  private async updateRecommendations(
    postId: string,
    authorId: string,
    hasMedia: boolean,
  ): Promise<void> {
    // TODO: Update recommendation engine
    this.logger.log(`Updating recommendations for post: ${postId}`);
  }

  private async trackPostCreation(
    postId: string,
    authorId: string,
    communityId: string | null,
    hasMedia: boolean,
  ): Promise<void> {
    // TODO: Track creation event in analytics
    this.logger.log(
      `Tracking post creation: ${postId} (hasMedia: ${hasMedia}, community: ${communityId || 'none'})`,
    );
  }
}
