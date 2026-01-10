import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Order Delivered Event
 *
 * Emitted when an order is successfully delivered.
 *
 * Side effects (handled in application layer):
 * - Send delivery confirmation notification
 * - Request review/feedback
 * - Complete payment (for COD)
 * - Track analytics event
 */
export class OrderDeliveredEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
  ) {
    super(orderId);
  }
}
