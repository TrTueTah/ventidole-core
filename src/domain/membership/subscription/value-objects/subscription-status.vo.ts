/**
 * Subscription Status Value Object
 *
 * Represents the status of a subscription.
 *
 * State Machine:
 * - PENDING_PAYMENT: Waiting for payment confirmation
 * - ACTIVE: Subscription is currently active
 * - EXPIRED: Subscription has expired (payment failed or end date reached)
 * - CANCELED: User canceled the subscription
 *
 * Transitions:
 * - PENDING_PAYMENT → ACTIVE (payment confirmed)
 * - PENDING_PAYMENT → EXPIRED (payment failed or timeout)
 * - ACTIVE → EXPIRED (payment fails or expiration date reached)
 * - ACTIVE → CANCELED (user cancels)
 * - EXPIRED → ACTIVE (payment succeeds - renewal)
 * - CANCELED cannot transition to any state (must create new subscription)
 */
export enum SubscriptionStatusEnum {
  PENDING_PAYMENT = 'PENDING_PAYMENT',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  CANCELED = 'CANCELED',
}

export class SubscriptionStatus {
  private readonly _value: SubscriptionStatusEnum;

  private constructor(value: SubscriptionStatusEnum) {
    this._value = value;
  }

  static create(value: string): SubscriptionStatus {
    const upperValue = value.toUpperCase();

    if (
      !Object.values(SubscriptionStatusEnum).includes(
        upperValue as SubscriptionStatusEnum,
      )
    ) {
      throw new Error(
        `Invalid subscription status: ${value}. Must be PENDING_PAYMENT, ACTIVE, EXPIRED, or CANCELED`,
      );
    }

    return new SubscriptionStatus(upperValue as SubscriptionStatusEnum);
  }

  static pendingPayment(): SubscriptionStatus {
    return new SubscriptionStatus(SubscriptionStatusEnum.PENDING_PAYMENT);
  }

  static active(): SubscriptionStatus {
    return new SubscriptionStatus(SubscriptionStatusEnum.ACTIVE);
  }

  static expired(): SubscriptionStatus {
    return new SubscriptionStatus(SubscriptionStatusEnum.EXPIRED);
  }

  static canceled(): SubscriptionStatus {
    return new SubscriptionStatus(SubscriptionStatusEnum.CANCELED);
  }

  get value(): string {
    return this._value;
  }

  isPendingPayment(): boolean {
    return this._value === SubscriptionStatusEnum.PENDING_PAYMENT;
  }

  isActive(): boolean {
    return this._value === SubscriptionStatusEnum.ACTIVE;
  }

  isExpired(): boolean {
    return this._value === SubscriptionStatusEnum.EXPIRED;
  }

  isCanceled(): boolean {
    return this._value === SubscriptionStatusEnum.CANCELED;
  }

  /**
   * Check if transition to new status is valid
   */
  canTransitionTo(newStatus: SubscriptionStatusEnum): boolean {
    switch (this._value) {
      case SubscriptionStatusEnum.PENDING_PAYMENT:
        // Can transition to ACTIVE (payment confirmed) or EXPIRED (payment failed/timeout)
        return (
          newStatus === SubscriptionStatusEnum.ACTIVE ||
          newStatus === SubscriptionStatusEnum.EXPIRED
        );

      case SubscriptionStatusEnum.ACTIVE:
        // Can transition to EXPIRED or CANCELED
        return (
          newStatus === SubscriptionStatusEnum.EXPIRED ||
          newStatus === SubscriptionStatusEnum.CANCELED
        );

      case SubscriptionStatusEnum.EXPIRED:
        // Can only renew (become ACTIVE again) or remain expired
        return (
          newStatus === SubscriptionStatusEnum.ACTIVE ||
          newStatus === SubscriptionStatusEnum.PENDING_PAYMENT
        );

      case SubscriptionStatusEnum.CANCELED:
        // Cannot transition from CANCELED (must create new subscription)
        return false;

      default:
        return false;
    }
  }

  equals(other: SubscriptionStatus): boolean {
    if (!(other instanceof SubscriptionStatus)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
