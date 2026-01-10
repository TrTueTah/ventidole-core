import { ProductId } from '@domain/shared/value-objects/product-id.vo';
import { ShopId } from '@domain/shared/value-objects/shop-id.vo';
import { ProductName } from './value-objects/product-name.vo';
import { Money } from '@domain/commerce/order/value-objects/money.vo';
import { ProductVariant } from './entities/product-variant.entity';
import { DomainEvent } from '@core/event/domain-event.base';
import { ProductCreatedEvent } from './events/product-created.event';
import { ProductUpdatedEvent } from './events/product-updated.event';
import { ProductStockUpdatedEvent } from './events/product-stock-updated.event';
import { ProductDeletedEvent } from './events/product-deleted.event';

/**
 * Product Aggregate
 *
 * Represents a product in the commerce domain.
 *
 * Invariants:
 * - Product must belong to a shop
 * - Product must have a name
 * - Product must have at least one active variant
 * - Price must be positive
 * - Stock cannot be negative
 *
 * Business Rules:
 * - Products can have multiple variants
 * - Variants can be individually activated/deactivated
 * - Product is available if at least one variant is available
 * - Stock updates emit events for inventory tracking
 */
export class ProductAggregate {
  private readonly _id: ProductId;
  private readonly _shopId: ShopId;
  private _name: ProductName;
  private _description: string | null;
  private _basePrice: Money;
  private _imageUrls: string[];
  private _category: string | null;
  private readonly _variants: Map<string, ProductVariant>;
  private _isActive: boolean;
  private _isDeleted: boolean;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private readonly _domainEvents: DomainEvent[];

  private constructor(props: {
    id: ProductId;
    shopId: ShopId;
    name: ProductName;
    description: string | null;
    basePrice: Money;
    imageUrls: string[];
    category: string | null;
    variants: Map<string, ProductVariant>;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }) {
    this._id = props.id;
    this._shopId = props.shopId;
    this._name = props.name;
    this._description = props.description;
    this._basePrice = props.basePrice;
    this._imageUrls = props.imageUrls;
    this._category = props.category;
    this._variants = props.variants;
    this._isActive = props.isActive;
    this._isDeleted = props.isDeleted;
    this._createdAt = props.createdAt;
    this._updatedAt = props.updatedAt;
    this._domainEvents = [];
  }

  /**
   * Factory: Create new product
   */
  static create(props: {
    shopId: string;
    name: string;
    description?: string;
    basePrice: number;
    imageUrls?: string[];
    category?: string;
    variants?: Array<{
      name: string;
      price: number;
      stock: number;
    }>;
  }): ProductAggregate {
    // Create default variant if none provided
    const variants = new Map<string, ProductVariant>();

    if (props.variants && props.variants.length > 0) {
      props.variants.forEach((v) => {
        const variant = ProductVariant.create(v);
        variants.set(variant.id, variant);
      });
    } else {
      // Create default variant with base price
      const defaultVariant = ProductVariant.create({
        name: 'Default',
        price: props.basePrice,
        stock: 0,
      });
      variants.set(defaultVariant.id, defaultVariant);
    }

    const product = new ProductAggregate({
      id: ProductId.generate(),
      shopId: ShopId.fromString(props.shopId),
      name: ProductName.create(props.name),
      description: props.description || null,
      basePrice: Money.fromAmount(props.basePrice),
      imageUrls: props.imageUrls || [],
      category: props.category || null,
      variants,
      isActive: true,
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    product.addDomainEvent(
      new ProductCreatedEvent(
        product._id.value,
        product._shopId.value,
        product._name.value,
      ),
    );

    return product;
  }

  /**
   * Factory: Reconstitute from persistence
   */
  static fromPersistence(props: {
    id: string;
    shopId: string;
    name: string;
    description: string | null;
    basePrice: number;
    imageUrls: string[];
    category: string | null;
    isActive: boolean;
    isDeleted: boolean;
    createdAt: Date;
    updatedAt: Date;
    variants: Array<{
      id: string;
      name: string;
      price: number;
      stock: number;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
    }>;
  }): ProductAggregate {
    const variants = new Map<string, ProductVariant>();
    props.variants.forEach((v) => {
      const variant = ProductVariant.fromPersistence(v);
      variants.set(variant.id, variant);
    });

    return new ProductAggregate({
      id: ProductId.fromString(props.id),
      shopId: ShopId.fromString(props.shopId),
      name: ProductName.create(props.name),
      description: props.description,
      basePrice: Money.fromAmount(props.basePrice),
      imageUrls: props.imageUrls,
      category: props.category,
      variants,
      isActive: props.isActive,
      isDeleted: props.isDeleted,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  /**
   * Update product details
   */
  update(props: {
    name?: string;
    description?: string;
    basePrice?: number;
    imageUrls?: string[];
    category?: string;
  }): void {
    // Invariant: Cannot update deleted product
    if (this._isDeleted) {
      throw new Error('Cannot update deleted product');
    }

    const changes: any = {};

    if (props.name && props.name !== this._name.value) {
      this._name = ProductName.create(props.name);
      changes.name = props.name;
    }

    if (props.description !== undefined && props.description !== this._description) {
      this._description = props.description || null;
      changes.description = props.description;
    }

    if (props.basePrice && props.basePrice !== this._basePrice.amount) {
      this._basePrice = Money.fromAmount(props.basePrice);
      changes.basePrice = props.basePrice;
    }

    if (props.imageUrls && JSON.stringify(props.imageUrls) !== JSON.stringify(this._imageUrls)) {
      // Validate max 10 images
      if (props.imageUrls.length > 10) {
        throw new Error('Cannot have more than 10 product images');
      }
      this._imageUrls = props.imageUrls;
      changes.imageUrls = props.imageUrls;
    }

    if (props.category !== undefined && props.category !== this._category) {
      this._category = props.category || null;
      changes.category = props.category;
    }

    if (Object.keys(changes).length > 0) {
      this._updatedAt = new Date();
      this.addDomainEvent(new ProductUpdatedEvent(this._id.value, changes));
    }
  }

  /**
   * Add variant
   */
  addVariant(props: { name: string; price: number; stock: number }): void {
    // Invariant: Cannot add variant to deleted product
    if (this._isDeleted) {
      throw new Error('Cannot add variant to deleted product');
    }

    // Invariant: Variant name must be unique
    const existingVariantNames = Array.from(this._variants.values()).map((v) => v.name.toLowerCase());
    if (existingVariantNames.includes(props.name.toLowerCase())) {
      throw new Error('Variant with this name already exists');
    }

    const variant = ProductVariant.create(props);
    this._variants.set(variant.id, variant);
    this._updatedAt = new Date();
  }

  /**
   * Update variant
   */
  updateVariant(variantId: string, props: { name?: string; price?: number }): void {
    // Invariant: Cannot update variant in deleted product
    if (this._isDeleted) {
      throw new Error('Cannot update variant in deleted product');
    }

    const variant = this._variants.get(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    // Invariant: Variant name must be unique (if changing name)
    if (props.name) {
      const existingVariantNames = Array.from(this._variants.values())
        .filter((v) => v.id !== variantId)
        .map((v) => v.name.toLowerCase());

      if (existingVariantNames.includes(props.name.toLowerCase())) {
        throw new Error('Variant with this name already exists');
      }
    }

    variant.update(props);
    this._updatedAt = new Date();
  }

  /**
   * Update variant stock
   */
  updateVariantStock(variantId: string, newStock: number): void {
    // Invariant: Cannot update stock in deleted product
    if (this._isDeleted) {
      throw new Error('Cannot update stock in deleted product');
    }

    const variant = this._variants.get(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    const oldStock = variant.stock.quantity;
    variant.updateStock(newStock);
    this._updatedAt = new Date();

    this.addDomainEvent(
      new ProductStockUpdatedEvent(this._id.value, variantId, oldStock, newStock),
    );
  }

  /**
   * Decrease variant stock
   */
  decreaseVariantStock(variantId: string, quantity: number): void {
    // Invariant: Cannot decrease stock in deleted product
    if (this._isDeleted) {
      throw new Error('Cannot decrease stock in deleted product');
    }

    const variant = this._variants.get(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    const oldStock = variant.stock.quantity;
    variant.decreaseStock(quantity);
    this._updatedAt = new Date();

    const newStock = variant.stock.quantity;
    this.addDomainEvent(
      new ProductStockUpdatedEvent(this._id.value, variantId, oldStock, newStock),
    );
  }

  /**
   * Increase variant stock
   */
  increaseVariantStock(variantId: string, quantity: number): void {
    // Invariant: Cannot increase stock in deleted product
    if (this._isDeleted) {
      throw new Error('Cannot increase stock in deleted product');
    }

    const variant = this._variants.get(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    const oldStock = variant.stock.quantity;
    variant.increaseStock(quantity);
    this._updatedAt = new Date();

    const newStock = variant.stock.quantity;
    this.addDomainEvent(
      new ProductStockUpdatedEvent(this._id.value, variantId, oldStock, newStock),
    );
  }

  /**
   * Activate variant
   */
  activateVariant(variantId: string): void {
    const variant = this._variants.get(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    variant.activate();
    this._updatedAt = new Date();
  }

  /**
   * Deactivate variant
   */
  deactivateVariant(variantId: string): void {
    const variant = this._variants.get(variantId);
    if (!variant) {
      throw new Error('Variant not found');
    }

    // Invariant: Cannot deactivate if it's the only active variant
    const activeVariants = Array.from(this._variants.values()).filter((v) => v.isActive);
    if (activeVariants.length === 1 && activeVariants[0].id === variantId) {
      throw new Error('Cannot deactivate the only active variant');
    }

    variant.deactivate();
    this._updatedAt = new Date();
  }

  /**
   * Activate product
   */
  activate(): void {
    if (this._isActive) {
      return;
    }

    // Invariant: Cannot activate deleted product
    if (this._isDeleted) {
      throw new Error('Cannot activate deleted product');
    }

    this._isActive = true;
    this._updatedAt = new Date();
  }

  /**
   * Deactivate product
   */
  deactivate(): void {
    if (!this._isActive) {
      return;
    }

    this._isActive = false;
    this._updatedAt = new Date();
  }

  /**
   * Soft delete product
   */
  delete(): void {
    if (this._isDeleted) {
      return;
    }

    this._isDeleted = true;
    this._isActive = false;
    this._updatedAt = new Date();

    this.addDomainEvent(new ProductDeletedEvent(this._id.value));
  }

  /**
   * Check if product is available for purchase
   */
  isAvailableForPurchase(): boolean {
    if (!this._isActive || this._isDeleted) {
      return false;
    }

    // At least one variant must be available
    return Array.from(this._variants.values()).some((v) => v.isActive && v.stock.isAvailable());
  }

  /**
   * Get available variants
   */
  getAvailableVariants(): ProductVariant[] {
    return Array.from(this._variants.values()).filter((v) => v.isActive && v.stock.isAvailable());
  }

  /**
   * Get all variants
   */
  getVariants(): ProductVariant[] {
    return Array.from(this._variants.values());
  }

  /**
   * Get variant by ID
   */
  getVariant(variantId: string): ProductVariant | undefined {
    return this._variants.get(variantId);
  }

  // Getters
  get id(): ProductId {
    return this._id;
  }

  get shopId(): ShopId {
    return this._shopId;
  }

  get name(): ProductName {
    return this._name;
  }

  get description(): string | null {
    return this._description;
  }

  get basePrice(): Money {
    return this._basePrice;
  }

  get imageUrls(): string[] {
    return this._imageUrls;
  }

  get category(): string | null {
    return this._category;
  }

  get isActive(): boolean {
    return this._isActive;
  }

  get isDeleted(): boolean {
    return this._isDeleted;
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
