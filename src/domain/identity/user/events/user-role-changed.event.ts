import { DomainEvent } from '@core/event/domain-event.base';

/**
 * UserRoleChangedEvent
 *
 * Emitted when a user's role is changed (e.g., FAN -> IDOL).
 *
 * Handlers may:
 * - Update permissions cache
 * - Notify user of role change
 * - Trigger role-specific onboarding
 * - Update analytics/reporting
 */
export class UserRoleChangedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly oldRole: string,
    public readonly newRole: string,
  ) {
    super(userId);
  }
}
