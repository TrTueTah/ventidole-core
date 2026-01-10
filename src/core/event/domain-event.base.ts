import { v4 as uuidv4 } from 'uuid';

/**
 * Base class for all domain events
 *
 * Domain events represent something meaningful that happened in the domain.
 * They are used to decouple domain logic from side effects like notifications.
 */
export abstract class DomainEvent {
  /**
   * Unique identifier for this event instance
   */
  readonly eventId: string;

  /**
   * When this event occurred
   */
  readonly occurredAt: Date;

  /**
   * The type of event (derived from class name)
   */
  readonly eventType: string;

  /**
   * The ID of the aggregate root that this event pertains to
   */
  readonly aggregateId: string;

  /**
   * @param aggregateId - The ID of the entity this event relates to
   */
  constructor(aggregateId: string) {
    this.eventId = uuidv4();
    this.occurredAt = new Date();
    this.aggregateId = aggregateId;
    this.eventType = this.constructor.name;
  }
}
