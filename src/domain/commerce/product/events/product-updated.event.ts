import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Product Updated Event
 *
 * Published when a product is updated.
 */
export class ProductUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly changes: Record<string, any>,
  ) {
    super(aggregateId);
  }
}
