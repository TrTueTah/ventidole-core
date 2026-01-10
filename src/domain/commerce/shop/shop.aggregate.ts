import { ShopId } from '@domain/shared/value-objects/shop-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { ShopName } from './value-objects/shop-name.vo';
import { DomainEvent } from '@core/event/domain-event.base';
import { ShopCreatedEvent } from './events/shop-created.event';
import { ShopUpdatedEvent } from './events/shop-updated.event';

/**
 * Shop Aggregate
 *
 * Represents a shop in the commerce domain.
 *
 * Invariants:
 * - Shop must have an owner
 * - Shop must have a name
 * - Shop name cannot exceed 100 characters
 *
 * Business Rules:
 * - Only shop owner can manage shop
 * - Shop can be activated/deactivated
 * - Deactivated shops cannot accept orders
 */
export class ShopAggregate {
  private readonly _id: ShopId;
  private readonly _ownerId: UserId;
  private _name: ShopName;
  private _description: string | null;
  private _logoUrl: string | null;
  private _bannerUrl: string | null;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(props: {
    id: ShopId;
    ownerId: UserId;
    name: ShopName;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._ownerId = props.ownerId;
    this._name = props.name;
    this._description = props.description;
    this._logoUrl = props.logoUrl;
    this._bannerUrl = props.bannerUrl;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._domainEvents = [];
  }

  /**
   * Factory: Create new shop
   */
  static create(props: {
    ownerId: string;
    name: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
  }): ShopAggregate {
    const shop = new ShopAggregate({
      id: ShopId.generate(),
      ownerId: UserId.fromString(props.ownerId),
      name: ShopName.create(props.name),
      description: props.description || null,
      logoUrl: props.logoUrl || null,
      bannerUrl: props.bannerUrl || null,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    shop.addDomainEvent(
      new ShopCreatedEvent(
        shop._id.value,
        shop._ownerId.value,
        shop._name.value,
      ),
    );

    return shop;
  }

  /**
   * Factory: Reconstitute from persistence
   */
  static fromPersistence(props: {
    id: string;
    ownerId: string;
    name: string;
    description: string | null;
    logoUrl: string | null;
    bannerUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ShopAggregate {
    return new ShopAggregate({
      id: ShopId.fromString(props.id),
      ownerId: UserId.fromString(props.ownerId),
      name: ShopName.create(props.name),
      description: props.description,
      logoUrl: props.logoUrl,
      bannerUrl: props.bannerUrl,
      isActive: props.isActive,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Update shop details
   */
  update(props: {
    name?: string;
    description?: string;
    logoUrl?: string;
    bannerUrl?: string;
  }): void {
    const changes: any = {};

    if (props.name && props.name !== this._name.value) {
      this._name = ShopName.create(props.name);
      changes.name = props.name;
    }

    if (props.description !== undefined && props.description !== this._description) {
      this._description = props.description || null;
      changes.description = props.description;
    }

    if (props.logoUrl !== undefined && props.logoUrl !== this._logoUrl) {
      this._logoUrl = props.logoUrl || null;
      changes.logoUrl = props.logoUrl;
    }

    if (props.bannerUrl !== undefined && props.bannerUrl !== this._bannerUrl) {
      this._bannerUrl = props.bannerUrl || null;
      changes.bannerUrl = props.bannerUrl;
    }

    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();
      this.addDomainEvent(new ShopUpdatedEvent(this._id.value, changes));
    }
  }

  /**
   * Activate shop
   */
  activate(): void {
    if (this._isActive) {
      return;
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Deactivate shop
   */
  deactivate(): void {
    if (!this._isActive) {
      return;
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Check if user is shop owner
   */
  isOwnedBy(userId: UserId): boolean {
    return this._ownerId.equals(userId);
  }

  // Getters
  get id(): ShopId {
    return this._id;
  }

  get ownerId(): UserId {
    return this._ownerId;
  }

  get name(): ShopName {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get logoUrl(): string | null {
    return this._logoUrl;
  }

  get bannerUrl(): string | null {
    return this._bannerUrl;
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
