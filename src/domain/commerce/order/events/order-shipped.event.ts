import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Order Shipped Event
 *
 * Emitted when an order is shipped.
 *
 * Side effects (handled in application layer):
 * - Send shipping notification to customer
 * - Update tracking information
 * - Track analytics event
 */
export class OrderShippedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly trackingNumber: string | null,
  ) {
    super(orderId);
  }
}
