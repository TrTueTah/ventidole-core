/**
 * Verification Entity
 *
 * Represents a verification token for email verification, password reset, etc.
 *
 * Business rules:
 * - Verification token expires after a set time
 * - Verification token can only be used once
 * - Verification type determines the purpose (register, reset password, etc.)
 */
export enum VerificationType {
  REGISTER_ACCOUNT = 'REGISTER_ACCOUNT',
  RESET_PASSWORD = 'RESET_PASSWORD',
  CHANGE_EMAIL = 'CHANGE_EMAIL',
  FIND_EMAIL = 'FIND_EMAIL',
}

export class Verification {
  private readonly _id: string;
  private readonly _email: string;
  private readonly _token: string;
  private readonly _type: VerificationType;
  private readonly _expiresAt: Date;
  private readonly _createdAt: Date;
  private _isUsed: boolean;
  private _usedAt: Date | null;

  private constructor(props: {
    id: string;
    email: string;
    token: string;
    type: VerificationType;
    expiresAt: Date;
    createdAt: Date;
    isUsed: boolean;
    usedAt: Date | null;
  }) {
    this._id = props.id;
    this._email = props.email;
    this._token = props.token;
    this._type = props.type;
    this._expiresAt = props.expiresAt;
    this._createdAt = props.createdAt;
    this._isUsed = props.isUsed;
    this._usedAt = props.usedAt;
  }

  static create(
    email: string,
    token: string,
    type: VerificationType,
    expiresInMinutes: number = 15,
  ): Verification {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + expiresInMinutes * 60 * 1000);
    const timestamp = now.getTime();

    return new Verification({
      id: `${email}_${type}_${timestamp}`,
      email,
      token,
      type,
      expiresAt,
      createdAt: now,
      isUsed: false,
      usedAt: null,
    });
  }

  static fromPersistence(props: {
    id: string;
    email: string;
    token: string;
    type: string;
    expiresAt: Date;
    createdAt: Date;
    isUsed: boolean;
    usedAt: Date | null;
  }): Verification {
    return new Verification({
      id: props.id,
      email: props.email,
      token: props.token,
      type: props.type as VerificationType,
      expiresAt: props.expiresAt,
      createdAt: props.createdAt,
      isUsed: props.isUsed,
      usedAt: props.usedAt,
    });
  }

  markAsUsed(): void {
    if (this._isUsed) {
      throw new Error('Verification token has already been used');
    }

    if (this.isExpired()) {
      throw new Error('Verification token has expired');
    }

    this._isUsed = true;
    this._usedAt = new Date();
  }

  isExpired(): boolean {
    return new Date() > this._expiresAt;
  }

  isValid(): boolean {
    return !this._isUsed && !this.isExpired();
  }

  get id(): string {
    return this._id;
  }

  get email(): string {
    return this._email;
  }

  get token(): string {
    return this._token;
  }

  get type(): VerificationType {
    return this._type;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get isUsed(): boolean {
    return this._isUsed;
  }

  get usedAt(): Date | null {
    return this._usedAt;
  }
}
