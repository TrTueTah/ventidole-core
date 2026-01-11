import { cuid } from '@paralleldrive/cuid2';

/**
 * Subscription ID Value Object
 *
 * Unique identifier for a subscription.
 */
export class SubscriptionId {
  private readonly _value: string;

  private constructor(value: string) {
    if (!value || value.trim().length === 0) {
      throw new Error('SubscriptionId cannot be empty');
    }
    this._value = value;
  }

  static generate(): SubscriptionId {
    return new SubscriptionId(cuid());
  }

  static fromString(value: string): SubscriptionId {
    return new SubscriptionId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: SubscriptionId): boolean {
    if (!(other instanceof SubscriptionId)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
