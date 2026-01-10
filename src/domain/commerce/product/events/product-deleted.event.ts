import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Product Deleted Event
 *
 * Published when a product is soft-deleted.
 */
export class ProductDeletedEvent extends DomainEvent {
  constructor(aggregateId: string) {
    super(aggregateId);
  }
}
