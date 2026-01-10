/**
 * SocialAccount Entity
 *
 * Represents a linked social media account (e.g., Google, Facebook).
 * This is an entity within the User aggregate.
 *
 * Business rules:
 * - Social account belongs to exactly one User
 * - Provider must be specified (e.g., 'google', 'facebook')
 * - Provider ID must be unique per provider
 * - Social accounts are immutable once created
 */
export class SocialAccount {
  private readonly _id: string;
  private readonly _provider: string; // 'google', 'facebook', etc.
  private readonly _providerId: string; // ID from the provider
  private readonly _email: string | null;
  private readonly _createdAt: Date;

  private constructor(props: {
    id: string;
    provider: string;
    providerId: string;
    email: string | null;
    createdAt: Date;
  }) {
    this._id = props.id;
    this._provider = props.provider;
    this._providerId = props.providerId;
    this._email = props.email;
    this._createdAt = props.createdAt;
  }

  /**
   * Create a new social account
   */
  static create(props: {
    provider: string;
    providerId: string;
    email: string | null;
  }): SocialAccount {
    return new SocialAccount({
      id: `${props.provider}_${props.providerId}`,
      provider: props.provider,
      providerId: props.providerId,
      email: props.email,
      createdAt: new Date(),
    });
  }

  /**
   * Reconstitute social account from persistence
   */
  static fromPersistence(props: {
    id: string;
    provider: string;
    providerId: string;
    email: string | null;
    createdAt: Date;
  }): SocialAccount {
    return new SocialAccount(props);
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get provider(): string {
    return this._provider;
  }

  get providerId(): string {
    return this._providerId;
  }

  get email(): string | null {
    return this._email;
  }

  get createdAt(): Date {
    return this._createdAt;
  }
}
