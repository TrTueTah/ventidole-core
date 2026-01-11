import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Subscription Renewed Event
 *
 * Published when a subscription is successfully renewed (payment succeeded).
 */
export class SubscriptionRenewedEvent extends DomainEvent {
  constructor(
    public readonly subscriptionId: string,
    public readonly userId: string,
    public readonly communityId: string,
    public readonly nextBillingDate: Date,
  ) {
    super(subscriptionId);
  }
}
