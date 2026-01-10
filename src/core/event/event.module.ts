import { Global, Module } from '@nestjs/common';
import { EventBus } from './event-bus.service';

/**
 * Global module that provides the EventBus throughout the application
 *
 * This module is marked as @Global() so the EventBus can be injected
 * anywhere without needing to import EventModule explicitly.
 *
 * Usage in other modules:
 * ```typescript
 * @Injectable()
 * export class PostService {
 *   constructor(private readonly eventBus: EventBus) {}
 *
 *   async createPost(...) {
 *     const post = await this.prisma.post.create(...);
 *     await this.eventBus.publish(new PostCreatedEvent(...));
 *   }
 * }
 * ```
 */
@Global()
@Module({
  providers: [EventBus],
  exports: [EventBus],
})
export class EventModule {}
