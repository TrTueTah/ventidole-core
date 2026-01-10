import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Post Deleted Event
 *
 * Emitted when a post is deleted (soft delete).
 *
 * Side effects (handled in application layer):
 * - Remove from recommendation engine
 * - Update user's post count
 * - Track analytics event
 */
export class PostDeletedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
  ) {
    super(postId);
  }
}
