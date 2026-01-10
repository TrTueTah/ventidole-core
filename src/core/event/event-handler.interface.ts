import { DomainEvent } from './domain-event.base';

/**
 * Interface for all event handlers
 *
 * Event handlers process domain events asynchronously and perform side effects
 * such as sending notifications, updating read models, or triggering integrations.
 */
export interface IEventHandler<T extends DomainEvent = DomainEvent> {
  /**
   * Handle the given event
   *
   * @param event - The domain event to process
   * @returns Promise that resolves when handling is complete
   *
   * Note: Handlers should catch and log their own errors rather than throwing,
   * as event handling is fire-and-forget and failures should not block the caller.
   */
  handle(event: T): Promise<void>;
}
