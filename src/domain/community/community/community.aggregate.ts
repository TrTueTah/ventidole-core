import { DomainEvent } from '@core/event/domain-event.base';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CommunityFollower } from './entities/community-follower.entity';
import {
  CommunityCreatedEvent,
  CommunityFollowedEvent,
  CommunityUnfollowedEvent,
} from './events';
import { CommunityName } from './value-objects/community-name.vo';
import { CommunityType } from './value-objects/community-type.vo';

/**
 * Community Aggregate Root
 *
 * Represents a community (SOLO or GROUP) with followers.
 *
 * Business Rules (Invariants):
 * - Community must have a unique name
 * - Community must have an owner
 * - SOLO communities: Only owner exists as follower
 * - GROUP communities: Multiple followers allowed
 * - User cannot follow the same community twice
 * - Community must be active to accept followers
 * - Soft delete only (isDeleted flag)
 *
 * Aggregate Boundary:
 * - Community (root)
 * - CommunityFollower (entity)
 */
export class CommunityAggregate {
  private readonly _id: CommunityId;
  private _name: CommunityName;
  private readonly _type: CommunityType;
  private readonly _ownerId: UserId;
  private _description: string | null;
  private _avatarUrl: string | null;
  private _backgroundUrl: string | null;
  private _followers: Map<string, CommunityFollower>; // userId -> Follower
  private _followerCount: number;
  private _postCount: number;
  private _isActive: boolean;
  private _isDeleted: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(props: {
    id: CommunityId;
    name: CommunityName;
    type: CommunityType;
    ownerId: UserId;
    description: string | null;
    avatarUrl: string | null;
    backgroundUrl: string | null;
    followers: Map<string, CommunityFollower>;
    followerCount: number;
    postCount: number;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._name = props.name;
    this._type = props.type;
    this._ownerId = props.ownerId;
    this._description = props.description;
    this._avatarUrl = props.avatarUrl;
    this._backgroundUrl = props.backgroundUrl;
    this._followers = props.followers;
    this._followerCount = props.followerCount;
    this._postCount = props.postCount;
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._domainEvents = [];
  }

  /**
   * Factory method: Create new community
   */
  static create(props: {
    name: string;
    type: string;
    ownerId: string;
    description?: string;
  }): CommunityAggregate {
    const type = CommunityType.create(props.type);
    const ownerId = UserId.fromString(props.ownerId);

    // For SOLO communities, owner is automatically a follower
    const followers = new Map<string, CommunityFollower>();
    if (type.isSolo()) {
      const ownerFollower = CommunityFollower.create(props.ownerId);
      followers.set(props.ownerId, ownerFollower);
    }

    const community = new CommunityAggregate({
      id: CommunityId.generate(),
      name: CommunityName.create(props.name),
      type,
      ownerId,
      description: props.description || null,
      avatarUrl: null,
      backgroundUrl: null,
      followers,
      followerCount: type.isSolo() ? 1 : 0,
      postCount: 0,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    community.addDomainEvent(
      new CommunityCreatedEvent(
        community._id.value,
        community._name.value,
        community._type.value,
        community._ownerId.value,
      ),
    );

    return community;
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static fromPersistence(props: {
    id: string;
    name: string;
    type: string;
    ownerId: string;
    description: string | null;
    avatarUrl: string | null;
    backgroundUrl: string | null;
    followerCount: number;
    postCount: number;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    followers?: Array<{ userId: string; followedAt: Date }>;
  }): CommunityAggregate {
    const followersMap = new Map<string, CommunityFollower>();

    if (props.followers) {
      for (const follower of props.followers) {
        const followerEntity = CommunityFollower.fromPersistence(follower);
        followersMap.set(follower.userId, followerEntity);
      }
    }

    return new CommunityAggregate({
      id: CommunityId.fromString(props.id),
      name: CommunityName.create(props.name),
      type: CommunityType.create(props.type),
      ownerId: UserId.fromString(props.ownerId),
      description: props.description,
      avatarUrl: props.avatarUrl,
      backgroundUrl: props.backgroundUrl,
      followers: followersMap,
      followerCount: props.followerCount,
      postCount: props.postCount,
      isActive: props.isActive,
      isDeleted: props.isDeleted,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Business method: Update community profile
   */
  updateProfile(props: {
    name?: string;
    description?: string | null;
    avatarUrl?: string | null;
    backgroundUrl?: string | null;
  }): void {
    // Invariant: Community must be active
    if (!this._isActive || this._isDeleted) {
      throw new Error('Cannot update profile of inactive or deleted community');
    }

    if (props.name && props.name !== this._name.value) {
      this._name = CommunityName.create(props.name);
    }

    if (props.description !== undefined) {
      this._description = props.description;
    }

    if (props.avatarUrl !== undefined) {
      this._avatarUrl = props.avatarUrl;
    }

    if (props.backgroundUrl !== undefined) {
      this._backgroundUrl = props.backgroundUrl;
    }

    this._updatedAt = new Date();
  }

  /**
   * Business method: Add follower
   */
  follow(userId: string): void {
    // Invariant: Community must be active
    if (!this._isActive || this._isDeleted) {
      throw new Error('Cannot follow inactive or deleted community');
    }

    // Invariant: Cannot follow twice
    if (this._followers.has(userId)) {
      throw new Error('User already follows this community');
    }

    // Invariant: SOLO communities only have owner as follower
    if (this._type.isSolo() && userId !== this._ownerId.value) {
      throw new Error('Cannot follow SOLO community (owner only)');
    }

    const follower = CommunityFollower.create(userId);
    this._followers.set(userId, follower);
    this._followerCount++;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new CommunityFollowedEvent(this._id.value, userId, this._name.value),
    );
  }

  /**
   * Business method: Remove follower
   */
  unfollow(userId: string): void {
    // Invariant: Cannot unfollow if not following
    if (!this._followers.has(userId)) {
      throw new Error('User does not follow this community');
    }

    // Invariant: Owner cannot unfollow SOLO community
    if (this._type.isSolo() && userId === this._ownerId.value) {
      throw new Error('Owner cannot unfollow their own SOLO community');
    }

    this._followers.delete(userId);
    this._followerCount--;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new CommunityUnfollowedEvent(this._id.value, userId, this._name.value),
    );
  }

  /**
   * Business method: Increment post count
   */
  incrementPostCount(): void {
    this._postCount++;
    this._updatedAt = new Date();
  }

  /**
   * Business method: Decrement post count
   */
  decrementPostCount(): void {
    if (this._postCount > 0) {
      this._postCount--;
      this._updatedAt = new Date();
    }
  }

  /**
   * Business method: Deactivate community
   */
  deactivate(): void {
    if (!this._isActive) {
      return;
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Business method: Soft delete community
   */
  delete(): void {
    if (this._isDeleted) {
      return;
    }

    this._isActive = false;
    this._isDeleted = true;
    this._updatedAt = new Date();
  }

  /**
   * Query method: Check if user is owner
   */
  isOwnedBy(userId: UserId): boolean {
    return this._ownerId.equals(userId);
  }

  /**
   * Query method: Check if user is follower
   */
  hasFollower(userId: UserId): boolean {
    return this._followers.has(userId.value);
  }

  /**
   * Query method: Get follower list
   */
  getFollowers(): ReadonlyArray<CommunityFollower> {
    return Array.from(this._followers.values());
  }

  // Getters
  get id(): CommunityId {
    return this._id;
  }

  get name(): CommunityName {
    return this._name;
  }

  get type(): CommunityType {
    return this._type;
  }

  get ownerId(): UserId {
    return this._ownerId;
  }

  get description(): string | null {
    return this._description;
  }

  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  get backgroundUrl(): string | null {
    return this._backgroundUrl;
  }

  get followerCount(): number {
    return this._followerCount;
  }

  get postCount(): number {
    return this._postCount;
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
