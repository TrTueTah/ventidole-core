import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Community Unfollowed Event
 *
 * Emitted when a user unfollows a community.
 *
 * Side effects (handled in application layer):
 * - Update follower count cache
 * - Track analytics event
 * - Trigger recommendation updates
 */
export class CommunityUnfollowedEvent extends DomainEvent {
  constructor(
    public readonly communityId: string,
    public readonly userId: string,
    public readonly communityName: string,
  ) {
    super(communityId);
  }
}
