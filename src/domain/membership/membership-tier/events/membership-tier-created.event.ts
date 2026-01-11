import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Membership Tier Created Event
 *
 * Published when a community owner creates a membership tier.
 */
export class MembershipTierCreatedEvent extends DomainEvent {
  constructor(
    public readonly tierId: string,
    public readonly communityId: string,
    public readonly tierName: string,
    public readonly monthlyPrice: number,
    public readonly yearlyPrice: number,
  ) {
    super(tierId);
  }
}
