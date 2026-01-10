import { Test, TestingModule } from '@nestjs/testing';
import { EventBus } from './event-bus.service';
import { DomainEvent } from './domain-event.base';
import { IEventHandler } from './event-handler.interface';

// Mock event for testing
class TestEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    public readonly data: string,
  ) {
    super(aggregateId);
  }
}

// Mock handler for testing
class MockEventHandler implements IEventHandler<TestEvent> {
  public handledEvents: TestEvent[] = [];
  public shouldThrow = false;

  async handle(event: TestEvent): Promise<void> {
    if (this.shouldThrow) {
      throw new Error('Handler intentionally failed');
    }
    this.handledEvents.push(event);
  }

  reset() {
    this.handledEvents = [];
    this.shouldThrow = false;
  }
}

describe('EventBus', () => {
  let eventBus: EventBus;
  let mockHandler: MockEventHandler;
  let mockHandler2: MockEventHandler;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventBus],
    }).compile();

    eventBus = module.get<EventBus>(EventBus);
    mockHandler = new MockEventHandler();
    mockHandler2 = new MockEventHandler();
  });

  afterEach(() => {
    mockHandler.reset();
    mockHandler2.reset();
    eventBus.clearHandlers();
  });

  describe('subscribe', () => {
    it('should register a handler for an event type', () => {
      eventBus.subscribe('TestEvent', mockHandler);

      expect(eventBus.getHandlerCount('TestEvent')).toBe(1);
    });

    it('should register multiple handlers for the same event type', () => {
      eventBus.subscribe('TestEvent', mockHandler);
      eventBus.subscribe('TestEvent', mockHandler2);

      expect(eventBus.getHandlerCount('TestEvent')).toBe(2);
    });
  });

  describe('publish', () => {
    it('should invoke registered handlers when event is published', async () => {
      eventBus.subscribe('TestEvent', mockHandler);

      const event = new TestEvent('test-aggregate-1', 'test data');
      await eventBus.publish(event);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockHandler.handledEvents).toHaveLength(1);
      expect(mockHandler.handledEvents[0]).toBe(event);
    });

    it('should invoke all registered handlers for an event', async () => {
      eventBus.subscribe('TestEvent', mockHandler);
      eventBus.subscribe('TestEvent', mockHandler2);

      const event = new TestEvent('test-aggregate-2', 'test data');
      await eventBus.publish(event);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      expect(mockHandler.handledEvents).toHaveLength(1);
      expect(mockHandler2.handledEvents).toHaveLength(1);
    });

    it('should not throw if no handlers are registered', async () => {
      const event = new TestEvent('test-aggregate-3', 'test data');

      await expect(eventBus.publish(event)).resolves.not.toThrow();
    });

    it('should not throw if a handler fails', async () => {
      mockHandler.shouldThrow = true;
      eventBus.subscribe('TestEvent', mockHandler);

      const event = new TestEvent('test-aggregate-4', 'test data');

      await expect(eventBus.publish(event)).resolves.not.toThrow();
    });

    it('should continue executing other handlers if one fails', async () => {
      mockHandler.shouldThrow = true;
      eventBus.subscribe('TestEvent', mockHandler);
      eventBus.subscribe('TestEvent', mockHandler2);

      const event = new TestEvent('test-aggregate-5', 'test data');
      await eventBus.publish(event);

      // Wait for setImmediate to execute
      await new Promise((resolve) => setImmediate(resolve));

      // Second handler should still execute
      expect(mockHandler2.handledEvents).toHaveLength(1);
    });

    it('should execute handlers asynchronously (non-blocking)', async () => {
      let handlerExecuted = false;
      const slowHandler: IEventHandler = {
        async handle() {
          await new Promise((resolve) => setTimeout(resolve, 100));
          handlerExecuted = true;
        },
      };

      eventBus.subscribe('TestEvent', slowHandler);

      const event = new TestEvent('test-aggregate-6', 'test data');
      await eventBus.publish(event);

      // Handler should not have executed yet (non-blocking)
      expect(handlerExecuted).toBe(false);

      // Wait for handler to complete
      await new Promise((resolve) => setTimeout(resolve, 150));
      expect(handlerExecuted).toBe(true);
    });
  });

  describe('getHandlerCount', () => {
    it('should return 0 for unregistered event types', () => {
      expect(eventBus.getHandlerCount('NonExistentEvent')).toBe(0);
    });

    it('should return correct count of registered handlers', () => {
      eventBus.subscribe('TestEvent', mockHandler);
      eventBus.subscribe('TestEvent', mockHandler2);

      expect(eventBus.getHandlerCount('TestEvent')).toBe(2);
    });
  });

  describe('clearHandlers', () => {
    it('should remove all registered handlers', () => {
      eventBus.subscribe('TestEvent', mockHandler);
      eventBus.subscribe('AnotherEvent', mockHandler2);

      expect(eventBus.getHandlerCount('TestEvent')).toBe(1);
      expect(eventBus.getHandlerCount('AnotherEvent')).toBe(1);

      eventBus.clearHandlers();

      expect(eventBus.getHandlerCount('TestEvent')).toBe(0);
      expect(eventBus.getHandlerCount('AnotherEvent')).toBe(0);
    });
  });

  describe('DomainEvent', () => {
    it('should generate unique event IDs', () => {
      const event1 = new TestEvent('aggregate-1', 'data1');
      const event2 = new TestEvent('aggregate-1', 'data2');

      expect(event1.eventId).not.toBe(event2.eventId);
    });

    it('should set event type to class name', () => {
      const event = new TestEvent('aggregate-1', 'data');

      expect(event.eventType).toBe('TestEvent');
    });

    it('should set occurredAt timestamp', () => {
      const before = new Date();
      const event = new TestEvent('aggregate-1', 'data');
      const after = new Date();

      expect(event.occurredAt.getTime()).toBeGreaterThanOrEqual(
        before.getTime(),
      );
      expect(event.occurredAt.getTime()).toBeLessThanOrEqual(after.getTime());
    });

    it('should store aggregate ID', () => {
      const event = new TestEvent('test-aggregate-id', 'data');

      expect(event.aggregateId).toBe('test-aggregate-id');
    });
  });
});
