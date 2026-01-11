import { DomainEvent } from '@core/event/domain-event.interface';

/**
 * Item Quantity Updated Event
 *
 * Emitted when an item's quantity is changed in the cart.
 */
export class ItemQuantityUpdatedEvent implements DomainEvent {
  public readonly eventName = 'ItemQuantityUpdatedEvent';
  public readonly occurredOn: Date;

  constructor(
    public readonly cartId: string,
    public readonly userId: string,
    public readonly itemId: string,
    public readonly oldQuantity: number,
    public readonly newQuantity: number,
    occurredOn: Date = new Date(),
  ) {
    this.occurredOn = occurredOn;
  }
}
