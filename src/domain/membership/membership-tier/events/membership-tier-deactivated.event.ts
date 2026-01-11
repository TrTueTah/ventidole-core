import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Membership Tier Deactivated Event
 *
 * Published when a tier is deactivated.
 */
export class MembershipTierDeactivatedEvent extends DomainEvent {
  constructor(
    public readonly tierId: string,
    public readonly communityId: string,
  ) {
    super(tierId);
  }
}
