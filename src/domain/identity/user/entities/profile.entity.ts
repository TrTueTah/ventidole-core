import { Bio } from '../value-objects/bio.vo';

/**
 * Profile Entity
 *
 * Represents a user's public profile information.
 * This is an entity within the User aggregate.
 *
 * Business rules:
 * - Profile belongs to exactly one User
 * - Avatar and background URLs are optional
 * - Bio is optional
 * - Online status is tracked
 */
export class Profile {
  private _avatarUrl: string | null;
  private _backgroundUrl: string | null;
  private _bio: Bio | null;
  private _isOnline: boolean;
  private _lastOnlineAt: Date | null;

  private constructor(props: {
    avatarUrl: string | null;
    backgroundUrl: string | null;
    bio: Bio | null;
    isOnline: boolean;
    lastOnlineAt: Date | null;
  }) {
    this._avatarUrl = props.avatarUrl;
    this._backgroundUrl = props.backgroundUrl;
    this._bio = props.bio;
    this._isOnline = props.isOnline;
    this._lastOnlineAt = props.lastOnlineAt;
  }

  /**
   * Create a new profile with default values
   */
  static create(): Profile {
    return new Profile({
      avatarUrl: null,
      backgroundUrl: null,
      bio: null,
      isOnline: false,
      lastOnlineAt: null,
    });
  }

  /**
   * Reconstitute profile from persistence
   */
  static fromPersistence(props: {
    avatarUrl: string | null;
    backgroundUrl: string | null;
    bio: string | null;
    isOnline: boolean;
    lastOnlineAt: Date | null;
  }): Profile {
    return new Profile({
      avatarUrl: props.avatarUrl,
      backgroundUrl: props.backgroundUrl,
      bio: Bio.create(props.bio),
      isOnline: props.isOnline,
      lastOnlineAt: props.lastOnlineAt,
    });
  }

  /**
   * Update avatar URL
   */
  updateAvatar(url: string | null): void {
    this._avatarUrl = url;
  }

  /**
   * Update background URL
   */
  updateBackground(url: string | null): void {
    this._backgroundUrl = url;
  }

  /**
   * Update bio
   */
  updateBio(bio: string | null): void {
    this._bio = Bio.create(bio);
  }

  /**
   * Mark user as online
   */
  setOnline(): void {
    this._isOnline = true;
    this._lastOnlineAt = new Date();
  }

  /**
   * Mark user as offline
   */
  setOffline(): void {
    this._isOnline = false;
    this._lastOnlineAt = new Date();
  }

  // Getters
  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  get backgroundUrl(): string | null {
    return this._backgroundUrl;
  }

  get bio(): string | null {
    return this._bio ? this._bio.value : null;
  }

  get isOnline(): boolean {
    return this._isOnline;
  }

  get lastOnlineAt(): Date | null {
    return this._lastOnlineAt;
  }
}
