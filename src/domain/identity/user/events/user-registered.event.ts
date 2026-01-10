import { DomainEvent } from '@core/event/domain-event.base';

/**
 * UserRegisteredEvent
 *
 * Emitted when a new user successfully registers.
 *
 * Handlers may:
 * - Send welcome email
 * - Create default profile settings
 * - Trigger analytics
 * - Setup initial recommendations
 */
export class UserRegisteredEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly email: string,
    public readonly username: string,
    public readonly role: string,
  ) {
    super(userId);
  }
}
