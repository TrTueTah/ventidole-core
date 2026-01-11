import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Subscription Expired Event
 *
 * Published when a subscription expires (payment failed or expiration date reached).
 */
export class SubscriptionExpiredEvent extends DomainEvent {
  constructor(
    public readonly subscriptionId: string,
    public readonly userId: string,
    public readonly communityId: string,
    public readonly reason: string, // 'payment_failed' | 'expiration_date_reached'
  ) {
    super(subscriptionId);
  }
}
