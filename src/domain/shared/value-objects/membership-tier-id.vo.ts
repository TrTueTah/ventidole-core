import { cuid } from '@paralleldrive/cuid2';

/**
 * Membership Tier ID Value Object
 *
 * Unique identifier for a membership tier.
 */
export class MembershipTierId {
  private readonly _value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('MembershipTierId cannot be empty');
    }
    this._value = value;
  }

  static generate(): MembershipTierId {
    return new MembershipTierId(cuid());
  }

  static fromString(value: string): MembershipTierId {
    return new MembershipTierId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: MembershipTierId): boolean {
    if (!(other instanceof MembershipTierId)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
