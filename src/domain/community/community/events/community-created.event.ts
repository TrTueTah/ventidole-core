import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Community Created Event
 *
 * Emitted when a new community is created.
 *
 * Side effects (handled in application layer):
 * - Create default community settings
 * - Send notification to owner
 * - Track analytics event
 */
export class CommunityCreatedEvent extends DomainEvent {
  constructor(
    public readonly communityId: string,
    public readonly name: string,
    public readonly type: string,
    public readonly ownerId: string,
  ) {
    super(communityId);
  }
}
