import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Order Created Event
 *
 * Emitted when a new order is created.
 *
 * Side effects (handled in application layer):
 * - Send order confirmation email
 * - Send notification to shop owner
 * - Create payment record (if CREDIT)
 * - Track analytics event
 */
export class OrderCreatedEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly customerId: string,
    public readonly shopId: string,
    public readonly totalAmount: number,
    public readonly paymentMethod: string,
  ) {
    super(orderId);
  }
}
