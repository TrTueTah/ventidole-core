/**
 * Subscription Payment Value Object
 *
 * Encapsulates payment details for a subscription.
 * Immutable record of payment transaction.
 */
export class SubscriptionPayment {
  private readonly _paymentLinkId: string;
  private readonly _checkoutUrl: string;
  private readonly _qrCode: string;
  private readonly _orderCode: number;
  private readonly _status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';

  private constructor(props: {
    paymentLinkId: string;
    checkoutUrl: string;
    qrCode: string;
    orderCode: number;
    status: 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED';
  }) {
    this._paymentLinkId = props.paymentLinkId;
    this._checkoutUrl = props.checkoutUrl;
    this._qrCode = props.qrCode;
    this._orderCode = props.orderCode;
    this._status = props.status;
  }

  /**
   * Create new payment (pending)
   */
  static createPending(props: {
    paymentLinkId: string;
    checkoutUrl: string;
    qrCode: string;
    orderCode: number;
  }): SubscriptionPayment {
    return new SubscriptionPayment({
      ...props,
      status: 'PENDING',
    });
  }

  /**
   * Mark payment as paid
   */
  markAsPaid(): SubscriptionPayment {
    if (this._status === 'PAID') {
      return this;
    }

    return new SubscriptionPayment({
      paymentLinkId: this._paymentLinkId,
      checkoutUrl: this._checkoutUrl,
      qrCode: this._qrCode,
      orderCode: this._orderCode,
      status: 'PAID',
    });
  }

  /**
   * Mark payment as failed
   */
  markAsFailed(): SubscriptionPayment {
    return new SubscriptionPayment({
      paymentLinkId: this._paymentLinkId,
      checkoutUrl: this._checkoutUrl,
      qrCode: this._qrCode,
      orderCode: this._orderCode,
      status: 'FAILED',
    });
  }

  /**
   * Mark payment as expired
   */
  markAsExpired(): SubscriptionPayment {
    return new SubscriptionPayment({
      paymentLinkId: this._paymentLinkId,
      checkoutUrl: this._checkoutUrl,
      qrCode: this._qrCode,
      orderCode: this._orderCode,
      status: 'EXPIRED',
    });
  }

  /**
   * Check if payment is pending
   */
  isPending(): boolean {
    return this._status === 'PENDING';
  }

  /**
   * Check if payment is paid
   */
  isPaid(): boolean {
    return this._status === 'PAID';
  }

  // Getters
  get paymentLinkId(): string {
    return this._paymentLinkId;
  }

  get checkoutUrl(): string {
    return this._checkoutUrl;
  }

  get qrCode(): string {
    return this._qrCode;
  }

  get orderCode(): number {
    return this._orderCode;
  }

  get status(): string {
    return this._status;
  }

  /**
   * Equality check
   */
  equals(other: SubscriptionPayment): boolean {
    return this._paymentLinkId === other._paymentLinkId;
  }
}
