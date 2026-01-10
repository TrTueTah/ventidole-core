import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Order Canceled Event
 *
 * Emitted when an order is canceled.
 *
 * Side effects (handled in application layer):
 * - Send cancellation notification
 * - Process refund (if already paid)
 * - Release inventory
 * - Track analytics event
 */
export class OrderCanceledEvent extends DomainEvent {
  constructor(
    public readonly orderId: string,
    public readonly reason: string | null,
  ) {
    super(orderId);
  }
}
