import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Product Created Event
 *
 * Published when a new product is created.
 */
export class ProductCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly shopId: string,
    public readonly productName: string,
  ) {
    super(aggregateId);
  }
}
