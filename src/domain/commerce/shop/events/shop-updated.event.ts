import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Shop Updated Event
 *
 * Published when a shop is updated.
 */
export class ShopUpdatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly changes: Record<string, any>,
  ) {
    super(aggregateId);
  }
}
