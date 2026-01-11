import { DomainEvent } from '@core/event/domain-event.base';
import { CommunityId } from '@domain/shared/value-objects/community-id.vo';
import { MembershipTierId } from '@domain/shared/value-objects/membership-tier-id.vo';
import { Money } from '@domain/commerce/order/value-objects/money.vo';
import { TierName } from './value-objects/tier-name.vo';
import {
  MembershipTierCreatedEvent,
  MembershipTierPricingUpdatedEvent,
  MembershipTierDeactivatedEvent,
} from './events';

/**
 * Membership Tier Aggregate Root
 *
 * Represents a paid membership tier for a community.
 *
 * Business Rules (Invariants):
 * - One tier per community
 * - Monthly price must be positive
 * - Yearly price must be positive
 * - Tier must be active to accept new subscriptions
 * - Cannot delete tier if it has active subscribers
 *
 * Aggregate Boundary:
 * - MembershipTier (root)
 */
export class MembershipTierAggregate {
  private readonly _id: MembershipTierId;
  private readonly _communityId: CommunityId;
  private _name: TierName;
  private _description: string | null;
  private _monthlyPrice: Money;
  private _yearlyPrice: Money;
  private _subscriberCount: number;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(props: {
    id: MembershipTierId;
    communityId: CommunityId;
    name: TierName;
    description: string | null;
    monthlyPrice: Money;
    yearlyPrice: Money;
    subscriberCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._communityId = props.communityId;
    this._name = props.name;
    this._description = props.description;
    this._monthlyPrice = props.monthlyPrice;
    this._yearlyPrice = props.yearlyPrice;
    this._subscriberCount = props.subscriberCount;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._domainEvents = [];
  }

  /**
   * Factory method: Create new membership tier
   */
  static create(props: {
    communityId: string;
    name: string;
    description?: string;
    monthlyPrice: number;
    yearlyPrice: number;
  }): MembershipTierAggregate {
    const monthlyPrice = Money.fromAmount(props.monthlyPrice);
    const yearlyPrice = Money.fromAmount(props.yearlyPrice);

    // Invariant: Prices must be positive
    if (monthlyPrice.amount <= 0) {
      throw new Error('Monthly price must be positive');
    }

    if (yearlyPrice.amount <= 0) {
      throw new Error('Yearly price must be positive');
    }

    const tier = new MembershipTierAggregate({
      id: MembershipTierId.generate(),
      communityId: CommunityId.fromString(props.communityId),
      name: TierName.create(props.name),
      description: props.description || null,
      monthlyPrice,
      yearlyPrice,
      subscriberCount: 0,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    tier.addDomainEvent(
      new MembershipTierCreatedEvent(
        tier._id.value,
        tier._communityId.value,
        tier._name.value,
        tier._monthlyPrice.amount,
        tier._yearlyPrice.amount,
      ),
    );

    return tier;
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static fromPersistence(props: {
    id: string;
    communityId: string;
    name: string;
    description: string | null;
    monthlyPrice: number;
    yearlyPrice: number;
    subscriberCount: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): MembershipTierAggregate {
    return new MembershipTierAggregate({
      id: MembershipTierId.fromString(props.id),
      communityId: CommunityId.fromString(props.communityId),
      name: TierName.create(props.name),
      description: props.description,
      monthlyPrice: Money.fromAmount(props.monthlyPrice),
      yearlyPrice: Money.fromAmount(props.yearlyPrice),
      subscriberCount: props.subscriberCount,
      isActive: props.isActive,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Business method: Update tier pricing
   */
  updatePricing(monthlyPrice: Money, yearlyPrice: Money): void {
    // Invariant: Tier must be active
    if (!this._isActive) {
      throw new Error('Cannot update pricing of inactive tier');
    }

    // Invariant: Prices must be positive
    if (monthlyPrice.amount <= 0) {
      throw new Error('Monthly price must be positive');
    }

    if (yearlyPrice.amount <= 0) {
      throw new Error('Yearly price must be positive');
    }

    const oldMonthlyPrice = this._monthlyPrice.amount;
    const oldYearlyPrice = this._yearlyPrice.amount;

    this._monthlyPrice = monthlyPrice;
    this._yearlyPrice = yearlyPrice;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new MembershipTierPricingUpdatedEvent(
        this._id.value,
        this._communityId.value,
        oldMonthlyPrice,
        monthlyPrice.amount,
        oldYearlyPrice,
        yearlyPrice.amount,
      ),
    );
  }

  /**
   * Business method: Update tier details
   */
  updateDetails(name: string, description: string | null): void {
    // Invariant: Tier must be active
    if (!this._isActive) {
      throw new Error('Cannot update details of inactive tier');
    }

    this._name = TierName.create(name);
    this._description = description;
    this._updatedAt = new Date();
  }

  /**
   * Business method: Increment subscriber count
   */
  incrementSubscriberCount(): void {
    this._subscriberCount++;
    this._updatedAt = new Date();
  }

  /**
   * Business method: Decrement subscriber count
   */
  decrementSubscriberCount(): void {
    if (this._subscriberCount > 0) {
      this._subscriberCount--;
      this._updatedAt = new Date();
    }
  }

  /**
   * Business method: Deactivate tier
   */
  deactivate(): void {
    if (!this._isActive) {
      return;
    }

    // Invariant: Cannot deactivate if has subscribers
    if (this._subscriberCount > 0) {
      throw new Error(
        'Cannot deactivate tier with active subscribers. Wait for subscriptions to expire or be canceled.',
      );
    }

    this._isActive = false;
    this._updatedAt = new Date();

    this.addDomainEvent(
      new MembershipTierDeactivatedEvent(
        this._id.value,
        this._communityId.value,
      ),
    );
  }

  /**
   * Business method: Activate tier
   */
  activate(): void {
    if (this._isActive) {
      return;
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Query method: Get monthly price
   */
  getMonthlyPrice(): Money {
    return this._monthlyPrice;
  }

  /**
   * Query method: Get yearly price
   */
  getYearlyPrice(): Money {
    return this._yearlyPrice;
  }

  /**
   * Query method: Calculate yearly discount percentage
   */
  getYearlyDiscount(): number {
    const monthlyTotal = this._monthlyPrice.amount * 12;
    const yearlyTotal = this._yearlyPrice.amount;

    if (monthlyTotal === 0) {
      return 0;
    }

    const discount = ((monthlyTotal - yearlyTotal) / monthlyTotal) * 100;
    return Math.round(discount * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Query method: Check if tier has subscribers
   */
  hasSubscribers(): boolean {
    return this._subscriberCount > 0;
  }

  // Getters
  get id(): MembershipTierId {
    return this._id;
  }

  get communityId(): CommunityId {
    return this._communityId;
  }

  get name(): TierName {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get subscriberCount(): number {
    return this._subscriberCount;
  }

  get isActive(): boolean {
    return this._isActive;
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
