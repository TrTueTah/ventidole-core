import { DomainEvent } from '@core/event/domain-event.interface';

/**
 * Cart Cleared Event
 *
 * Emitted when all items are removed from the cart.
 *
 * Reasons:
 * - PAYMENT_SUCCESS: Cart cleared after successful payment
 * - MANUAL: User manually cleared cart
 * - ABANDONED: Cart cleared due to abandonment policy
 */
export class CartClearedEvent implements DomainEvent {
  public readonly eventName = 'CartClearedEvent';
  public readonly occurredOn: Date;

  constructor(
    public readonly cartId: string,
    public readonly userId: string,
    public readonly reason: 'PAYMENT_SUCCESS' | 'MANUAL' | 'ABANDONED',
    occurredOn: Date = new Date(),
  ) {
    this.occurredOn = occurredOn;
  }
}
