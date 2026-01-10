import { DomainEvent } from '@core/event/domain-event.base';

/**
 * UserDeactivatedEvent
 *
 * Emitted when a user account is deactivated.
 *
 * Handlers may:
 * - Revoke active sessions
 * - Cancel scheduled tasks
 * - Archive user data
 * - Notify related services
 */
export class UserDeactivatedEvent extends DomainEvent {
  constructor(public readonly userId: string) {
    super(userId);
  }
}
