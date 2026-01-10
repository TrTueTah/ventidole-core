import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Post Liked Event
 *
 * Emitted when a user likes a post.
 *
 * Side effects (handled in application layer):
 * - Send notification to post author
 * - Update like count cache
 * - Track analytics event
 * - Update recommendation engine
 */
export class PostLikedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
    public readonly authorId: string,
  ) {
    super(postId);
  }
}
