import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Subscription Canceled Event
 *
 * Published when a user cancels their subscription.
 */
export class SubscriptionCanceledEvent extends DomainEvent {
  constructor(
    public readonly subscriptionId: string,
    public readonly userId: string,
    public readonly communityId: string,
    public readonly canceledAt: Date,
  ) {
    super(subscriptionId);
  }
}
