import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { DomainEvent } from './domain-event.base';
import { IEventHandler } from './event-handler.interface';

/**
 * EventBus orchestrates the publishing and handling of domain events
 *
 * The EventBus uses a non-blocking, fire-and-forget approach to ensure that
 * domain operations are not slowed down by event handlers. Handlers are executed
 * asynchronously and errors are logged but do not propagate to the caller.
 */
@Injectable()
export class EventBus implements OnModuleInit {
  private readonly logger = new Logger(EventBus.name);
  private readonly handlers = new Map<string, IEventHandler[]>();

  constructor(private readonly moduleRef: ModuleRef) {}

  /**
   * Called when the module is initialized
   * Allows handlers to be registered after dependency injection is complete
   */
  onModuleInit() {
    this.logger.log('EventBus initialized');
  }

  /**
   * Register an event handler for a specific event type
   *
   * @param eventType - The name of the event class (e.g., 'PostCreatedEvent')
   * @param handler - The handler instance that will process events of this type
   */
  subscribe(eventType: string, handler: IEventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }

    this.handlers.get(eventType).push(handler);
    this.logger.log(
      `Registered handler for ${eventType} (${this.handlers.get(eventType).length} total)`,
    );
  }

  /**
   * Publish a domain event to all registered handlers
   *
   * This method is non-blocking. It schedules handlers to run asynchronously
   * using setImmediate, which allows the caller to continue without waiting
   * for handlers to complete.
   *
   * @param event - The domain event to publish
   *
   * Example usage:
   * ```typescript
   * await this.eventBus.publish(
   *   new PostCreatedEvent(post.id, post.authorId, post.communityId)
   * );
   * ```
   */
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) || [];

    if (handlers.length === 0) {
      this.logger.debug(
        `No handlers registered for event type: ${event.eventType}`,
      );
      return;
    }

    this.logger.debug(
      `Publishing ${event.eventType} (${event.eventId}) to ${handlers.length} handler(s)`,
    );

    // Non-blocking, fire-and-forget execution
    setImmediate(() => {
      this.executeHandlers(event, handlers);
    });
  }

  /**
   * Execute all handlers for an event
   *
   * Uses Promise.allSettled to ensure all handlers run even if some fail.
   * Logs errors but does not throw them.
   *
   * @param event - The event being processed
   * @param handlers - The handlers to execute
   */
  private async executeHandlers(
    event: DomainEvent,
    handlers: IEventHandler[],
  ): Promise<void> {
    const startTime = Date.now();

    const results = await Promise.allSettled(
      handlers.map((handler) =>
        handler.handle(event).catch((error) => {
          this.logger.error(
            `Handler failed for ${event.eventType} (${event.eventId}): ${error.message}`,
            error.stack,
          );
          throw error; // Re-throw to be caught by Promise.allSettled
        }),
      ),
    );

    const duration = Date.now() - startTime;
    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    this.logger.log(
      `Processed ${event.eventType} (${event.eventId}) in ${duration}ms: ${succeeded} succeeded, ${failed} failed`,
    );
  }

  /**
   * Get the number of registered handlers for an event type
   * Useful for testing and debugging
   *
   * @param eventType - The event type to check
   * @returns The number of registered handlers
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length || 0;
  }

  /**
   * Clear all registered handlers
   * Useful for testing
   */
  clearHandlers(): void {
    this.handlers.clear();
    this.logger.log('All event handlers cleared');
  }
}
