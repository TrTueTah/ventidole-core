/**
 * Core Module Exports
 *
 * This module provides the foundational technical infrastructure for the application.
 * It contains no business logic - only technical concerns like:
 * - Configuration
 * - Decorators
 * - Event handling
 * - Exception handling
 * - Guards
 * - Interceptors
 * - Pipes
 * - Response wrappers
 * - Type definitions
 *
 * DEPENDENCY RULE:
 * core/ MUST NOT import from: domain/, infra/, application/, or shared/
 * core/ MAY import from: NestJS, third-party libraries
 *
 * Other layers depend on core:
 * core → domain → application → controller
 */

// Configuration
export * from './config/doc.config';
export * from './config/env.config';
export * from './config/knock.config';
export * from './config/mail.config';
export * from './config/queue.config';
export * from './config/redis.config';
export * from './config/stream-chat.config';

// Decorators
export * from './decorator/current-user.decorator';
export * from './decorator/doc.decorator';
export * from './decorator/public.decorator';
export * from './decorator/role.decorator';

// Event System
export * from './event/domain-event.base';
export * from './event/event-bus.service';
export * from './event/event-handler.interface';
export * from './event/event.module';

// Exception Handling
export * from './exception/custom-error';
export * from './exception/custom-http.exception';
export * from './exception/exception.filter';
export * from './exception/exception.interface';
export * from './exception/request.interface';

// Guards
export * from './guard/jwt-auth.guard';

// Interceptors
export * from './interceptor/http-logger.interceptor';

// Pipes
export * from './pipe/validation.pipe';

// Response Wrappers
export * from './response';

// Types & Enums
export * from './types';

// Utilities
export * from './utils';
