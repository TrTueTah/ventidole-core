/**
 * Payment Method Value Object
 *
 * Represents the payment method for an order.
 *
 * Business rules:
 * - CREDIT: Payment upfront (online)
 * - COD: Cash on delivery
 */
export enum PaymentMethodEnum {
  CREDIT = 'CREDIT',
  COD = 'COD',
}

export class PaymentMethod {
  private readonly _value: PaymentMethodEnum;

  private constructor(value: PaymentMethodEnum) {
    this._value = value;
  }

  static create(value: string): PaymentMethod {
    const upperValue = value.toUpperCase();

    if (!Object.values(PaymentMethodEnum).includes(upperValue as PaymentMethodEnum)) {
      throw new Error(`Invalid payment method: ${value}. Must be CREDIT or COD`);
    }

    return new PaymentMethod(upperValue as PaymentMethodEnum);
  }

  static credit(): PaymentMethod {
    return new PaymentMethod(PaymentMethodEnum.CREDIT);
  }

  static cod(): PaymentMethod {
    return new PaymentMethod(PaymentMethodEnum.COD);
  }

  get value(): string {
    return this._value;
  }

  isCredit(): boolean {
    return this._value === PaymentMethodEnum.CREDIT;
  }

  isCod(): boolean {
    return this._value === PaymentMethodEnum.COD;
  }

  equals(other: PaymentMethod): boolean {
    if (!(other instanceof PaymentMethod)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
