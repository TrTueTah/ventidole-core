/**
 * User Domain
 *
 * Main exports for the User bounded context within Identity domain.
 */

// Aggregate
export { UserAggregate } from './user.aggregate';

// Repository
export { UserRepository } from './user.repository';

// Value Objects
export {
  Email,
  Username,
  Role,
  RoleEnum,
  PasswordHash,
  Bio,
} from './value-objects';

// Entities
export { Profile, SocialAccount } from './entities';

// Events
export {
  UserRegisteredEvent,
  UserProfileUpdatedEvent,
  UserRoleChangedEvent,
  UserDeactivatedEvent,
} from './events';
