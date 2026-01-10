import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Order Paid Event
 *
 * Emitted when payment is received for an order.
 *
 * Side effects (handled in application layer):
 * - Send payment confirmation notification
 * - Update payment record
 * - Trigger fulfillment process
 * - Track analytics event
 */
export class OrderPaidEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
    public readonly amount: number,
  ) {
    super(orderId);
  }
}
