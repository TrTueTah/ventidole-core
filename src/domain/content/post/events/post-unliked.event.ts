import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Post Unliked Event
 *
 * Emitted when a user unlikes a post.
 *
 * Side effects (handled in application layer):
 * - Update like count cache
 * - Track analytics event
 */
export class PostUnlikedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly userId: string,
  ) {
    super(postId);
  }
}
