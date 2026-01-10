import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Order Confirmed Event
 *
 * Emitted when an order is confirmed by the shop.
 *
 * Side effects (handled in application layer):
 * - Send confirmation notification to customer
 * - Update inventory (reserve items)
 * - Track analytics event
 */
export class OrderConfirmedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly shopId: string,
  ) {
    super(orderId);
  }
}
