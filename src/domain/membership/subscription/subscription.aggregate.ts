import { DomainEvent } from '@core/event/domain-event.base';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { MembershipTierId } from '@domain/shared/value-objects/membership-tier-id.vo';
import { SubscriptionId } from '@domain/shared/value-objects/subscription-id.vo';
import { Money } from '@domain/commerce/order/value-objects/money.vo';
import { SubscriptionStatus } from './value-objects/subscription-status.vo';
import { BillingCycle } from './value-objects/billing-cycle.vo';
import {
  SubscriptionStartedEvent,
  SubscriptionRenewedEvent,
  SubscriptionExpiredEvent,
  SubscriptionCanceledEvent,
  SubscriptionPaymentCompletedEvent,
} from './events';

/**
 * Subscription Aggregate Root
 *
 * Represents a user's subscription to a community's membership tier.
 *
 * Business Rules (Invariants):
 * - One subscription per user per community
 * - Next billing date must be in future for ACTIVE subscriptions
 * - Cannot renew CANCELED subscriptions (must create new)
 * - Expiration date must be after start date
 * - Status transitions must be valid (enforced by SubscriptionStatus VO)
 *
 * State Machine:
 * - ACTIVE → EXPIRED (payment fails or expiration reached)
 * - ACTIVE → CANCELED (user cancels)
 * - EXPIRED → ACTIVE (payment succeeds - renewal)
 * - CANCELED → (no transitions - must create new subscription)
 *
 * Aggregate Boundary:
 * - Subscription (root)
 */
export class SubscriptionAggregate {
  private readonly _id: SubscriptionId;
  private readonly _userId: UserId;
  private readonly _tierId: MembershipTierId;
  private readonly _communityId: CommunityId;
  private _status: SubscriptionStatus;
  private readonly _billingCycle: BillingCycle;
  private readonly _price: Money;
  private readonly _startDate: Date;
  private _nextBillingDate: Date;
  private _expirationDate: Date | null;
  private _canceledAt: Date | null;
  private _paymentLinkId: string | null;
  private _checkoutUrl: string | null;
  private _qrCode: string | null;
  private _orderCode: number | null;
  private _paidAt: Date | null;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(props: {
    id: SubscriptionId;
    userId: UserId;
    tierId: MembershipTierId;
    communityId: CommunityId;
    status: SubscriptionStatus;
    billingCycle: BillingCycle;
    price: Money;
    startDate: Date;
    nextBillingDate: Date;
    expirationDate: Date | null;
    canceledAt: Date | null;
    paymentLinkId: string | null;
    checkoutUrl: string | null;
    qrCode: string | null;
    orderCode: number | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._userId = props.userId;
    this._tierId = props.tierId;
    this._communityId = props.communityId;
    this._status = props.status;
    this._billingCycle = props.billingCycle;
    this._price = props.price;
    this._startDate = props.startDate;
    this._nextBillingDate = props.nextBillingDate;
    this._expirationDate = props.expirationDate;
    this._canceledAt = props.canceledAt;
    this._paymentLinkId = props.paymentLinkId;
    this._checkoutUrl = props.checkoutUrl;
    this._qrCode = props.qrCode;
    this._orderCode = props.orderCode;
    this._paidAt = props.paidAt;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._domainEvents = [];
  }

  /**
   * Factory method: Create new subscription
   * @deprecated Use createPending() for payment-based subscriptions
   */
  static create(props: {
    userId: string;
    tierId: string;
    communityId: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    price: number;
  }): SubscriptionAggregate {
    const price = Money.fromAmount(props.price);
    const billingCycle =
      props.billingCycle === 'MONTHLY'
        ? BillingCycle.monthly()
        : BillingCycle.yearly();

    // Invariant: Price must be positive
    if (price.amount <= 0) {
      throw new Error('Subscription price must be positive');
    }

    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setDate(
      nextBillingDate.getDate() + billingCycle.getDurationInDays(),
    );

    const subscription = new SubscriptionAggregate({
      id: SubscriptionId.generate(),
      userId: UserId.fromString(props.userId),
      tierId: MembershipTierId.fromString(props.tierId),
      communityId: CommunityId.fromString(props.communityId),
      status: SubscriptionStatus.active(),
      billingCycle,
      price,
      startDate: now,
      nextBillingDate,
      expirationDate: null,
      canceledAt: null,
      paymentLinkId: null,
      checkoutUrl: null,
      qrCode: null,
      orderCode: null,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    });

    subscription.addDomainEvent(
      new SubscriptionStartedEvent(
        subscription._id.value,
        subscription._userId.value,
        subscription._communityId.value,
        subscription._tierId.value,
        subscription._billingCycle.value,
        subscription._price.amount,
      ),
    );

    return subscription;
  }

  /**
   * Factory method: Create subscription pending payment (PayOS flow)
   */
  static createPending(props: {
    userId: string;
    tierId: string;
    communityId: string;
    billingCycle: 'MONTHLY' | 'YEARLY';
    price: number;
    paymentLinkId: string;
    checkoutUrl: string;
    qrCode: string;
    orderCode: number;
  }): SubscriptionAggregate {
    const price = Money.fromAmount(props.price);
    const billingCycle =
      props.billingCycle === 'MONTHLY'
        ? BillingCycle.monthly()
        : BillingCycle.yearly();

    // Invariant: Price must be positive
    if (price.amount <= 0) {
      throw new Error('Subscription price must be positive');
    }

    const now = new Date();
    const nextBillingDate = new Date(now);
    nextBillingDate.setDate(
      nextBillingDate.getDate() + billingCycle.getDurationInDays(),
    );

    const subscription = new SubscriptionAggregate({
      id: SubscriptionId.generate(),
      userId: UserId.fromString(props.userId),
      tierId: MembershipTierId.fromString(props.tierId),
      communityId: CommunityId.fromString(props.communityId),
      status: SubscriptionStatus.pendingPayment(),
      billingCycle,
      price,
      startDate: now,
      nextBillingDate,
      expirationDate: null,
      canceledAt: null,
      paymentLinkId: props.paymentLinkId,
      checkoutUrl: props.checkoutUrl,
      qrCode: props.qrCode,
      orderCode: props.orderCode,
      paidAt: null,
      createdAt: now,
      updatedAt: now,
    });

    // Note: Do NOT publish SubscriptionStartedEvent yet
    // Event will be published when payment is confirmed

    return subscription;
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static fromPersistence(props: {
    id: string;
    userId: string;
    tierId: string;
    communityId: string;
    status: string;
    billingCycle: string;
    price: number;
    startDate: Date;
    nextBillingDate: Date;
    expirationDate: Date | null;
    canceledAt: Date | null;
    paymentLinkId: string | null;
    checkoutUrl: string | null;
    qrCode: string | null;
    orderCode: number | null;
    paidAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
  }): SubscriptionAggregate {
    const statusMap: Record<string, SubscriptionStatus> = {
      PENDING_PAYMENT: SubscriptionStatus.pendingPayment(),
      ACTIVE: SubscriptionStatus.active(),
      EXPIRED: SubscriptionStatus.expired(),
      CANCELED: SubscriptionStatus.canceled(),
    };

    const billingCycleMap: Record<string, BillingCycle> = {
      MONTHLY: BillingCycle.monthly(),
      YEARLY: BillingCycle.yearly(),
    };

    return new SubscriptionAggregate({
      id: SubscriptionId.fromString(props.id),
      userId: UserId.fromString(props.userId),
      tierId: MembershipTierId.fromString(props.tierId),
      communityId: CommunityId.fromString(props.communityId),
      status: statusMap[props.status],
      billingCycle: billingCycleMap[props.billingCycle],
      price: Money.fromAmount(props.price),
      startDate: props.startDate,
      nextBillingDate: props.nextBillingDate,
      expirationDate: props.expirationDate,
      canceledAt: props.canceledAt,
      paymentLinkId: props.paymentLinkId,
      checkoutUrl: props.checkoutUrl,
      qrCode: props.qrCode,
      orderCode: props.orderCode,
      paidAt: props.paidAt,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Business method: Renew subscription (payment succeeded)
   */
  renew(paidAt: Date): void {
    // Invariant: Cannot renew canceled subscription
    if (this._status.isCanceled()) {
      throw new Error(
        'Cannot renew canceled subscription. Please create a new subscription.',
      );
    }

    // If expired, reactivate
    if (this._status.isExpired()) {
      this._status = SubscriptionStatus.active();
    }

    // Calculate next billing date
    const nextBillingDate = new Date(paidAt);
    nextBillingDate.setDate(
      nextBillingDate.getDate() + this._billingCycle.getDurationInDays(),
    );

    this._nextBillingDate = nextBillingDate;
    this._expirationDate = null;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new SubscriptionRenewedEvent(
        this._id.value,
        this._userId.value,
        this._communityId.value,
        this._nextBillingDate,
      ),
    );
  }

  /**
   * Business method: Confirm payment (PayOS webhook)
   * Transitions from PENDING_PAYMENT to ACTIVE
   */
  confirmPayment(paidAt: Date): void {
    // Invariant: Can only confirm payment if pending
    if (!this._status.isPendingPayment()) {
      throw new Error(
        'Can only confirm payment for subscriptions with PENDING_PAYMENT status',
      );
    }

    // Activate subscription
    this._status = SubscriptionStatus.active();
    this._paidAt = paidAt;
    this._updatedAt = new Date();

    // Publish domain events
    this.addDomainEvent(
      new SubscriptionPaymentCompletedEvent(
        this._id.value,
        this._userId.value,
        this._communityId.value,
        this._paymentLinkId!,
        this._price.amount,
      ),
    );

    this.addDomainEvent(
      new SubscriptionStartedEvent(
        this._id.value,
        this._userId.value,
        this._communityId.value,
        this._tierId.value,
        this._billingCycle.value,
        this._price.amount,
      ),
    );
  }

  /**
   * Business method: Expire subscription (payment failed or reached expiration)
   */
  expire(reason: 'payment_failed' | 'expiration_date_reached'): void {
    // Invariant: Cannot expire if not active
    if (!this._status.isActive()) {
      return;
    }

    this._status = SubscriptionStatus.expired();
    this._expirationDate = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new SubscriptionExpiredEvent(
        this._id.value,
        this._userId.value,
        this._communityId.value,
        reason,
      ),
    );
  }

  /**
   * Business method: Cancel subscription (user-initiated)
   */
  cancel(): void {
    // Invariant: Cannot cancel if not active
    if (!this._status.isActive()) {
      throw new Error('Can only cancel active subscriptions');
    }

    this._status = SubscriptionStatus.canceled();
    this._canceledAt = new Date();
    this._updatedAt = new Date();

    this.addDomainEvent(
      new SubscriptionCanceledEvent(
        this._id.value,
        this._userId.value,
        this._communityId.value,
        this._canceledAt,
      ),
    );
  }

  /**
   * Query method: Check if subscription is active
   */
  isActive(): boolean {
    return this._status.isActive();
  }

  /**
   * Query method: Check if subscription is expired
   */
  isExpired(): boolean {
    return this._status.isExpired();
  }

  /**
   * Query method: Check if subscription is canceled
   */
  isCanceled(): boolean {
    return this._status.isCanceled();
  }

  /**
   * Query method: Calculate days until expiration
   */
  daysUntilExpiration(): number {
    if (!this.isActive()) {
      return 0;
    }

    const now = new Date();
    const diffTime = this._nextBillingDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays);
  }

  /**
   * Query method: Check if subscription is about to expire (within N days)
   */
  isExpiringWithin(days: number): boolean {
    if (!this.isActive()) {
      return false;
    }

    return this.daysUntilExpiration() <= days;
  }

  // Getters
  get id(): SubscriptionId {
    return this._id;
  }

  get userId(): UserId {
    return this._userId;
  }

  get tierId(): MembershipTierId {
    return this._tierId;
  }

  get communityId(): CommunityId {
    return this._communityId;
  }

  get status(): SubscriptionStatus {
    return this._status;
  }

  get billingCycle(): BillingCycle {
    return this._billingCycle;
  }

  get price(): Money {
    return this._price;
  }

  get startDate(): Date {
    return this._startDate;
  }

  get nextBillingDate(): Date {
    return this._nextBillingDate;
  }

  get expirationDate(): Date | null {
    return this._expirationDate;
  }

  get canceledAt(): Date | null {
    return this._canceledAt;
  }

  get paymentLinkId(): string | null {
    return this._paymentLinkId;
  }

  get checkoutUrl(): string | null {
    return this._checkoutUrl;
  }

  get qrCode(): string | null {
    return this._qrCode;
  }

  get orderCode(): number | null {
    return this._orderCode;
  }

  get paidAt(): Date | null {
    return this._paidAt;
  }

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  get domainEvents(): ReadonlyArray<DomainEvent> {
    return this._domainEvents;
  }

  private addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  clearDomainEvents(): void {
    this._domainEvents.length = 0;
  }
}
