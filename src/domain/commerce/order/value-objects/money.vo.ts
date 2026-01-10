/**
 * Money Value Object
 *
 * Represents monetary amount with currency.
 *
 * Business rules:
 * - Amount cannot be negative
 * - Amount has two decimal places (cents)
 * - Currency is VND (Vietnamese Dong)
 */
export class Money {
  private readonly _amount: number; // Amount in cents (smallest unit)
  private readonly _currency: string;

  private constructor(amount: number, currency: string = 'VND') {
    this.validate(amount, currency);
    this._amount = amount;
    this._currency = currency;
  }

  static create(amount: number, currency: string = 'VND'): Money {
    return new Money(amount, currency);
  }

  static zero(): Money {
    return new Money(0, 'VND');
  }

  /**
   * Create from display amount (e.g., 100000 VND)
   */
  static fromAmount(amount: number, currency: string = 'VND'): Money {
    // VND doesn't use decimal places, so amount = cents
    return new Money(Math.round(amount), currency);
  }

  private validate(amount: number, currency: string): void {
    if (amount < 0) {
      throw new Error('Money amount cannot be negative');
    }

    if (!Number.isInteger(amount)) {
      throw new Error('Money amount must be an integer (smallest unit)');
    }

    if (!currency || currency.trim().length === 0) {
      throw new Error('Currency cannot be empty');
    }
  }

  get amount(): number {
    return this._amount;
  }

  get currency(): string {
    return this._currency;
  }

  /**
   * Get display amount (e.g., 100000 for VND)
   */
  getDisplayAmount(): number {
    return this._amount;
  }

  /**
   * Add two money amounts
   */
  add(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error('Cannot add money with different currencies');
    }

    return new Money(this._amount + other._amount, this._currency);
  }

  /**
   * Subtract money amount
   */
  subtract(other: Money): Money {
    if (this._currency !== other._currency) {
      throw new Error('Cannot subtract money with different currencies');
    }

    return new Money(this._amount - other._amount, this._currency);
  }

  /**
   * Multiply by quantity
   */
  multiply(multiplier: number): Money {
    if (multiplier < 0) {
      throw new Error('Multiplier cannot be negative');
    }

    return new Money(Math.round(this._amount * multiplier), this._currency);
  }

  /**
   * Check if equal to another money amount
   */
  equals(other: Money): boolean {
    if (!(other instanceof Money)) {
      return false;
    }
    return this._amount === other._amount && this._currency === other._currency;
  }

  /**
   * Check if greater than another money amount
   */
  greaterThan(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this._amount > other._amount;
  }

  /**
   * Check if less than another money amount
   */
  lessThan(other: Money): boolean {
    if (this._currency !== other._currency) {
      throw new Error('Cannot compare money with different currencies');
    }
    return this._amount < other._amount;
  }

  toString(): string {
    return `${this.getDisplayAmount()} ${this._currency}`;
  }
}
