import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Product Stock Updated Event
 *
 * Published when product stock is updated.
 */
export class ProductStockUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly variantId: string,
    public readonly oldStock: number,
    public readonly newStock: number,
  ) {
    super(aggregateId);
  }
}
