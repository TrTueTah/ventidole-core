import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Post Created Event
 *
 * Emitted when a new post is created.
 *
 * Side effects (handled in application layer):
 * - Send notifications to community followers
 * - Update recommendation engine
 * - Track analytics event
 * - Update user's post count
 */
export class PostCreatedEvent extends DomainEvent {
  constructor(
    public readonly postId: string,
    public readonly authorId: string,
    public readonly communityId: string | null,
    public readonly hasMedia: boolean,
  ) {
    super(postId);
  }
}
