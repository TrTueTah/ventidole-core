import { DomainEvent } from '@core/event/domain-event.interface';

/**
 * Cart Checked Out Event
 *
 * Emitted when a cart is checked out (order created).
 */
export class CartCheckedOutEvent implements DomainEvent {
  public readonly eventName = 'CartCheckedOutEvent';
  public readonly occurredOn: Date;

  constructor(
    public readonly cartId: string,
    public readonly userId: string,
    public readonly orderId: string,
    public readonly totalAmount: number,
    public readonly itemCount: number,
    occurredOn: Date = new Date(),
  ) {
    this.occurredOn = occurredOn;
  }
}
