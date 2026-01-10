import { UserId } from '@domain/shared/value-objects/user-id.vo';

/**
 * Community Follower Entity
 *
 * Represents a user following a community.
 *
 * Business rules:
 * - A user can only follow a community once
 * - Follower has a followedAt timestamp
 * - Entity is identified by userId (within the Community aggregate)
 */
export class CommunityFollower {
  private readonly _userId: UserId;
  private readonly _followedAt: Date;

  private constructor(props: { userId: UserId; followedAt: Date }) {
    this._userId = props.userId;
    this._followedAt = props.followedAt;
  }

  /**
   * Factory method: Create new follower
   */
  static create(userId: string): CommunityFollower {
    return new CommunityFollower({
      userId: UserId.fromString(userId),
      followedAt: new Date(),
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static fromPersistence(props: {
    userId: string;
    followedAt: Date;
  }): CommunityFollower {
    return new CommunityFollower({
      userId: UserId.fromString(props.userId),
      followedAt: props.followedAt,
    });
  }

  // Getters
  get userId(): UserId {
    return this._userId;
  }

  get followedAt(): Date {
    return this._followedAt;
  }

  /**
   * Check if this follower is the same user
   */
  isUser(userId: UserId): boolean {
    return this._userId.equals(userId);
  }
}
