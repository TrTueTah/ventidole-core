import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Subscription Payment Completed Event
 *
 * Published when a subscription payment is successfully completed via PayOS webhook.
 */
export class SubscriptionPaymentCompletedEvent extends DomainEvent {
  constructor(
    public readonly subscriptionId: string,
    public readonly userId: string,
    public readonly communityId: string,
    public readonly paymentLinkId: string,
    public readonly amount: number,
  ) {
    super(subscriptionId);
  }
}
