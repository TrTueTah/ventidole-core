import { DomainEvent } from '@core/event/domain-event.base';

/**
 * Shop Created Event
 *
 * Published when a new shop is created.
 */
export class ShopCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly ownerId: string,
    public readonly shopName: string,
  ) {
    super(aggregateId);
  }
}
