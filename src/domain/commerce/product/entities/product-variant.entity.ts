import { cuid } from '@paralleldrive/cuid2';
import { Money } from '@domain/commerce/order/value-objects/money.vo';
import { Stock } from '../value-objects/stock.vo';

/**
 * Product Variant Entity
 *
 * Represents a specific variant of a product (e.g., size, color).
 *
 * Invariants:
 * - Variant must have a unique name within the product
 * - Price must be positive
 * - Stock cannot be negative
 */
export class ProductVariant {
  private readonly _id: string;
  private _name: string;
  private _price: Money;
  private _stock: Stock;
  private _isActive: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;

  private constructor(props: {
    id: string;
    name: string;
    price: Money;
    stock: Stock;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._name = props.name;
    this._price = props.price;
    this._stock = props.stock;
    this._isActive = props.isActive;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
  }

  /**
   * Factory: Create new variant
   */
  static create(props: {
    name: string;
    price: number;
    stock: number;
  }): ProductVariant {
    if (!props.name || props.name.trim().length === 0) {
      throw new Error('Variant name cannot be empty');
    }

    if (props.name.trim().length > 100) {
      throw new Error('Variant name cannot exceed 100 characters');
    }

    return new ProductVariant({
      id: cuid(),
      name: props.name.trim(),
      price: Money.fromAmount(props.price),
      stock: Stock.create(props.stock),
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * Factory: Reconstitute from persistence
   */
  static fromPersistence(props: {
    id: string;
    name: string;
    price: number;
    stock: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): ProductVariant {
    return new ProductVariant({
      id: props.id,
      name: props.name,
      price: Money.fromAmount(props.price),
      stock: Stock.create(props.stock),
      isActive: props.isActive,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Update variant details
   */
  update(props: { name?: string; price?: number }): void {
    if (props.name !== undefined) {
      const trimmed = props.name.trim();
      if (trimmed.length === 0) {
        throw new Error('Variant name cannot be empty');
      }
      if (trimmed.length > 100) {
        throw new Error('Variant name cannot exceed 100 characters');
      }
      this._name = trimmed;
    }

    if (props.price !== undefined) {
      this._price = Money.fromAmount(props.price);
    }

    this._updatedAt = new Date();
  }

  /**
   * Update stock
   */
  updateStock(newStock: number): void {
    this._stock = Stock.create(newStock);
    this._updatedAt = new Date();
  }

  /**
   * Decrease stock
   */
  decreaseStock(quantity: number): void {
    this._stock = this._stock.decrease(quantity);
    this._updatedAt = new Date();
  }

  /**
   * Increase stock
   */
  increaseStock(quantity: number): void {
    this._stock = this._stock.increase(quantity);
    this._updatedAt = new Date();
  }

  /**
   * Activate variant
   */
  activate(): void {
    if (this._isActive) {
      return;
    }
    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Deactivate variant
   */
  deactivate(): void {
    if (!this._isActive) {
      return;
    }
    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Check if variant is available for purchase
   */
  isAvailableForPurchase(quantity: number): boolean {
    return this._isActive && this._stock.hasSufficient(quantity);
  }

  // Getters
  get id(): string {
    return this._id;
  }

  get name(): string {
    return this._name;
  }

  get price(): Money {
    return this._price;
  }

  get stock(): Stock {
    return this._stock;
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
}
