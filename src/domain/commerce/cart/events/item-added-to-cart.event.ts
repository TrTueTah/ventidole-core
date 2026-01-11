import { DomainEvent } from '@core/event/domain-event.interface';

/**
 * Item Added To Cart Event
 *
 * Emitted when a new item is added to the cart.
 */
export class ItemAddedToCartEvent implements DomainEvent {
  public readonly eventName = 'ItemAddedToCartEvent';
  public readonly occurredOn: Date;

  constructor(
    public readonly cartId: string,
    public readonly userId: string,
    public readonly productId: string,
    public readonly variantId: string | null,
    public readonly quantity: number,
    public readonly unitPrice: number,
    occurredOn: Date = new Date(),
  ) {
    this.occurredOn = occurredOn;
  }
}
