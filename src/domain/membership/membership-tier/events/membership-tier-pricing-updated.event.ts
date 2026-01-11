import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Membership Tier Pricing Updated Event
 *
 * Published when tier pricing changes.
 */
export class MembershipTierPricingUpdatedEvent extends DomainEvent {
  constructor(
    public readonly tierId: string,
    public readonly communityId: string,
    public readonly oldMonthlyPrice: number,
    public readonly newMonthlyPrice: number,
    public readonly oldYearlyPrice: number,
    public readonly newYearlyPrice: number,
  ) {
    super(tierId);
  }
}
