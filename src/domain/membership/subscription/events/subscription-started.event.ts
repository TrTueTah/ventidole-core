import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Subscription Started Event
 *
 * Published when a user subscribes to a community tier.
 */
export class SubscriptionStartedEvent extends DomainEvent {
  constructor(
    public readonly subscriptionId: string,
    public readonly userId: string,
    public readonly communityId: string,
    public readonly tierId: string,
    public readonly billingCycle: string,
    public readonly price: number,
  ) {
    super(subscriptionId);
  }
}
