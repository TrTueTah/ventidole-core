import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Community Followed Event
 *
 * Emitted when a user follows a community.
 *
 * Side effects (handled in application layer):
 * - Send notification to community owner
 * - Update follower count cache
 * - Track analytics event
 * - Trigger recommendation updates
 */
export class CommunityFollowedEvent extends DomainEvent {
  constructor(
    public readonly communityId: string,
    public readonly userId: string,
    public readonly communityName: string,
  ) {
    super(communityId);
  }
}
