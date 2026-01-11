import { DomainEvent } from '@core/event/domain-event.interface';

/**
 * Cart Created Event
 *
 * Emitted when a new cart is created for a user.
 */
export class CartCreatedEvent implements DomainEvent {
  public readonly eventName = 'CartCreatedEvent';
  public readonly occurredOn: Date;

  constructor(
    public readonly cartId: string,
    public readonly userId: string,
    occurredOn: Date = new Date(),
  ) {
    this.occurredOn = occurredOn;
  }
}
