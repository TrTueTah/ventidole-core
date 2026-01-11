import { DomainEvent } from '@core/event/domain-event.base';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { Profile } from './entities/profile.entity';
import { SocialAccount } from './entities/social-account.entity';
import {
  UserDeactivatedEvent,
  UserProfileUpdatedEvent,
  UserRegisteredEvent,
  UserRoleChangedEvent,
} from './events';
import { Email } from './value-objects/email.vo';
import { PasswordHash } from './value-objects/password-hash.vo';
import { Role } from './value-objects/role.vo';
import { Username } from './value-objects/username.vo';

/**
 * User Aggregate Root
 *
 * Represents a user in the system.
 *
 * Business rules:
 * - User must have a unique email
 * - User must have a unique username
 * - User can have one of three roles: FAN, IDOL, ADMIN
 * - User can link multiple social accounts
 * - User can update their profile
 * - Only admin can change user roles
 * - Deactivated users cannot perform actions
 */
export class UserAggregate {
  private readonly _id: UserId;
  private _email: Email;
  private _username: Username;
  private _passwordHash: PasswordHash;
  private _role: Role;
  private _profile: Profile;
  private _socialAccounts: Map<string, SocialAccount>;
  private _isActive: boolean;
  private _isDeleted: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(props: {
    id: UserId;
    email: Email;
    username: Username;
    passwordHash: PasswordHash;
    role: Role;
    profile: Profile;
    socialAccounts: Map<string, SocialAccount>;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._email = props.email;
    this._username = props.username;
    this._passwordHash = props.passwordHash;
    this._role = props.role;
    this._profile = props.profile;
    this._socialAccounts = props.socialAccounts;
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._domainEvents = [];
  }

  /**
   * Factory method: Register a new user
   */
  static register(props: {
    email: string;
    username: string;
    passwordHash: string;
    role?: string;
  }): UserAggregate {
    const user = new UserAggregate({
      id: UserId.generate(),
      email: Email.create(props.email),
      username: Username.create(props.username),
      passwordHash: PasswordHash.create(props.passwordHash),
      role: props.role ? Role.create(props.role) : Role.fan(),
      profile: Profile.create(),
      socialAccounts: new Map(),
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    user.addDomainEvent(
      new UserRegisteredEvent(
        user._id.value,
        user._email.value,
        user._username.value,
        user._role.value,
      ),
    );

    return user;
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static fromPersistence(props: {
    id: string;
    email: string;
    username: string;
    passwordHash: string;
    role: string;
    avatarUrl: string | null;
    backgroundUrl: string | null;
    bio: string | null;
    isOnline: boolean;
    lastOnlineAt: Date | null;
    socialAccounts: Array<{
      id: string;
      provider: string;
      providerId: string;
      email: string | null;
      createdAt: Date;
    }>;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): UserAggregate {
    const socialAccountsMap = new Map<string, SocialAccount>();
    props.socialAccounts.forEach((account) => {
      socialAccountsMap.set(account.id, SocialAccount.fromPersistence(account));
    });

    return new UserAggregate({
      id: UserId.fromString(props.id),
      email: Email.create(props.email),
      username: Username.create(props.username),
      passwordHash: PasswordHash.create(props.passwordHash),
      role: Role.create(props.role),
      profile: Profile.fromPersistence({
        avatarUrl: props.avatarUrl,
        backgroundUrl: props.backgroundUrl,
        bio: props.bio,
        isOnline: props.isOnline,
        lastOnlineAt: props.lastOnlineAt,
      }),
      socialAccounts: socialAccountsMap,
      isActive: props.isActive,
      isDeleted: props.isDeleted,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Business method: Update profile
   *
   * Invariant: User must be active
   */
  updateProfile(props: {
    username?: string;
    avatarUrl?: string | null;
    backgroundUrl?: string | null;
    bio?: string | null;
  }): void {
    // Invariant: User must be active
    if (!this._isActive || this._isDeleted) {
      throw new Error('Cannot update profile of inactive or deleted user');
    }

    const changes: any = {};

    // Update username if provided and different
    if (props.username && props.username !== this._username.value) {
      this._username = Username.create(props.username);
      changes.username = props.username;
    }

    // Update avatar if provided
    if (props.avatarUrl !== undefined) {
      this._profile.updateAvatar(props.avatarUrl);
      changes.avatarUrl = props.avatarUrl;
    }

    // Update background if provided
    if (props.backgroundUrl !== undefined) {
      this._profile.updateBackground(props.backgroundUrl);
      changes.backgroundUrl = props.backgroundUrl;
    }

    // Update bio if provided
    if (props.bio !== undefined) {
      this._profile.updateBio(props.bio);
      changes.bio = props.bio;
    }

    // Only emit event if something changed
    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();
      this.addDomainEvent(new UserProfileUpdatedEvent(this._id.value, changes));
    }
  }

  /**
   * Business method: Change role
   *
   * Invariant: Only admin can change roles
   * This method should only be called after policy check
   */
  changeRole(newRole: string): void {
    const role = Role.create(newRole);

    // No change - skip
    if (this._role.equals(role)) {
      return;
    }

    const oldRole = this._role.value;
    this._role = role;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new UserRoleChangedEvent(this._id.value, oldRole, role.value),
    );
  }

  /**
   * Business method: Change email
   *
   * Invariant: User must be active
   * Invariant: New email must be different
   */
  changeEmail(newEmail: string): void {
    // Invariant: User must be active
    if (!this._isActive || this._isDeleted) {
      throw new Error('Cannot change email of inactive or deleted user');
    }

    const email = Email.create(newEmail);

    // No change - skip
    if (this._email.equals(email)) {
      return;
    }

    this._email = email;
    this._updatedAt = new Date();
  }

  /**
   * Business method: Change password
   *
   * Invariant: User must be active
   */
  changePassword(newPasswordHash: string): void {
    // Invariant: User must be active
    if (!this._isActive || this._isDeleted) {
      throw new Error('Cannot change password of inactive or deleted user');
    }

    this._passwordHash = PasswordHash.create(newPasswordHash);
    this._updatedAt = new Date();
  }

  /**
   * Business method: Check if user can login
   *
   * Invariant: User must be active and not deleted to login
   *
   * Throws UnauthorizedException if user cannot login
   */
  canLogin(): void {
    if (!this._isActive) {
      throw new Error('User account is deactivated');
    }

    if (this._isDeleted) {
      throw new Error('User account has been deleted');
    }
  }

  /**
   * Business method: Deactivate user
   *
   * Invariant: Cannot deactivate already inactive user
   */
  deactivate(): void {
    if (!this._isActive) {
      return; // Already inactive
    }

    this._isActive = false;
    this._updatedAt = new Date();

    this.addDomainEvent(new UserDeactivatedEvent(this._id.value));
  }

  /**
   * Business method: Reactivate user
   */
  reactivate(): void {
    if (this._isActive) {
      return; // Already active
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Business method: Soft delete user
   *
   * Invariant: Cannot delete already deleted user
   */
  softDelete(): void {
    if (this._isDeleted) {
      return; // Already deleted
    }

    this._isDeleted = true;
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Business method: Add social account
   *
   * Invariant: User must be active
   * Invariant: Cannot add duplicate provider
   */
  addSocialAccount(props: {
    provider: string;
    providerId: string;
    email: string | null;
  }): void {
    // Invariant: User must be active
    if (!this._isActive || this._isDeleted) {
      throw new Error('Cannot add social account to inactive or deleted user');
    }

    const socialAccount = SocialAccount.create(props);

    // Invariant: Cannot add duplicate provider
    if (this._socialAccounts.has(socialAccount.id)) {
      throw new Error(
        `Social account for provider ${props.provider} already exists`,
      );
    }

    this._socialAccounts.set(socialAccount.id, socialAccount);
    this._updatedAt = new Date();
  }

  /**
   * Business method: Remove social account
   */
  removeSocialAccount(accountId: string): void {
    if (!this._socialAccounts.has(accountId)) {
      return; // Account doesn't exist
    }

    this._socialAccounts.delete(accountId);
    this._updatedAt = new Date();
  }

  /**
   * Business method: Set online status
   */
  setOnline(): void {
    this._profile.setOnline();
    this._updatedAt = new Date();
  }

  /**
   * Business method: Set offline status
   */
  setOffline(): void {
    this._profile.setOffline();
    this._updatedAt = new Date();
  }

  // Getters
  get id(): UserId {
    return this._id;
  }

  get email(): Email {
    return this._email;
  }

  get username(): Username {
    return this._username;
  }

  get passwordHash(): PasswordHash {
    return this._passwordHash;
  }

  get role(): Role {
    return this._role;
  }

  get profile(): Profile {
    return this._profile;
  }

  get socialAccounts(): SocialAccount[] {
    return Array.from(this._socialAccounts.values());
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }
}
