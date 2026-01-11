import { DomainEvent } from '@core/event/domain-event.interface';

/**
 * Item Removed From Cart Event
 *
 * Emitted when an item is removed from the cart.
 */
export class ItemRemovedFromCartEvent implements DomainEvent {
  public readonly eventName = 'ItemRemovedFromCartEvent';
  public readonly occurredOn: Date;

  constructor(
    public readonly cartId: string,
    public readonly userId: string,
    public readonly itemId: string,
    public readonly productId: string,
    occurredOn: Date = new Date(),
  ) {
    this.occurredOn = occurredOn;
  }
}
