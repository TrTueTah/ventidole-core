/**
 * Billing Cycle Value Object
 *
 * Represents the billing frequency for a subscription.
 *
 * Business rules:
 * - MONTHLY: Billed every 30 days
 * - YEARLY: Billed every 365 days
 */
export enum BillingCycleEnum {
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export class BillingCycle {
  private readonly _value: BillingCycleEnum;

  private constructor(value: BillingCycleEnum) {
    this._value = value;
  }

  static create(value: string): BillingCycle {
    const upperValue = value.toUpperCase();

    if (
      !Object.values(BillingCycleEnum).includes(
        upperValue as BillingCycleEnum,
      )
    ) {
      throw new Error(
        `Invalid billing cycle: ${value}. Must be MONTHLY or YEARLY`,
      );
    }

    return new BillingCycle(upperValue as BillingCycleEnum);
  }

  static monthly(): BillingCycle {
    return new BillingCycle(BillingCycleEnum.MONTHLY);
  }

  static yearly(): BillingCycle {
    return new BillingCycle(BillingCycleEnum.YEARLY);
  }

  get value(): string {
    return this._value;
  }

  isMonthly(): boolean {
    return this._value === BillingCycleEnum.MONTHLY;
  }

  isYearly(): boolean {
    return this._value === BillingCycleEnum.YEARLY;
  }

  /**
   * Get the duration of this billing cycle in days
   */
  getDurationInDays(): number {
    return this.isMonthly() ? 30 : 365;
  }

  equals(other: BillingCycle): boolean {
    if (!(other instanceof BillingCycle)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
