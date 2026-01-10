import { DomainEvent } from '@core/event/domain-event.base';

/**
 * UserProfileUpdatedEvent
 *
 * Emitted when a user updates their profile.
 *
 * Handlers may:
 * - Invalidate cached profile data
 * - Update search index
 * - Notify followers of profile changes
 */
export class UserProfileUpdatedEvent extends DomainEvent {
  constructor(
    public readonly userId: string,
    public readonly changes: {
      username?: string;
      avatarUrl?: string | null;
      backgroundUrl?: string | null;
      bio?: string | null;
    },
  ) {
    super(userId);
  }
}
