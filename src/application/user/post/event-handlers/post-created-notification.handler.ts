import { DomainEvent } from '@core/event/domain-event.base';
import { IEventHandler } from '@core/event/event-handler.interface';
import { PostCreatedEvent } from '@domain/content/post/events/post-created.event';
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

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof PostCreatedEvent)) {
      return;
    }

    this.logger.log(
      `Handling PostCreatedEvent for post: ${event.postId} by author: ${event.authorId}`,
    );

    try {
      // TODO: Send notifications to community followers
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
    // TODO: Send notifications via Knock
    this.logger.log(
      `Notifying community ${communityId} followers about new post: ${postId}`,
    );
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
