/**
 * Role Value Object
 *
 * Represents a user's role in the system.
 *
 * Business rules:
 * - Role must be one of: FAN, IDOL, ADMIN
 * - Role determines permissions and capabilities
 * - Role is immutable once created
 */
export enum RoleEnum {
  FAN = 'FAN',
  IDOL = 'IDOL',
  ADMIN = 'ADMIN',
}

export class Role {
  private readonly _value: RoleEnum;

  private constructor(value: RoleEnum) {
    this._value = value;
  }

  static create(value: string): Role {
    const upperValue = value.toUpperCase();

    if (!Object.values(RoleEnum).includes(upperValue as RoleEnum)) {
      throw new Error(
        `Invalid role: ${value}. Must be one of: ${Object.values(RoleEnum).join(', ')}`,
      );
    }

    return new Role(upperValue as RoleEnum);
  }

  static fan(): Role {
    return new Role(RoleEnum.FAN);
  }

  static idol(): Role {
    return new Role(RoleEnum.IDOL);
  }

  static admin(): Role {
    return new Role(RoleEnum.ADMIN);
  }

  get value(): string {
    return this._value;
  }

  isFan(): boolean {
    return this._value === RoleEnum.FAN;
  }

  isIdol(): boolean {
    return this._value === RoleEnum.IDOL;
  }

  isAdmin(): boolean {
    return this._value === RoleEnum.ADMIN;
  }

  /**
   * Check if this role can perform admin actions
   */
  canPerformAdminActions(): boolean {
    return this._value === RoleEnum.ADMIN;
  }

  /**
   * Check if this role can create content
   */
  canCreateContent(): boolean {
    return this._value === RoleEnum.IDOL || this._value === RoleEnum.ADMIN;
  }

  equals(other: Role): boolean {
    if (!other) return false;
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
