import { CartItemId } from '@domain/shared/value-objects/cart-item-id.vo';
import { ProductId } from '@domain/shared/value-objects/product-id.vo';
import { Money } from '@domain/commerce/order/value-objects/money.vo';
import { Quantity } from '../value-objects/quantity.vo';

/**
 * Cart Item Entity
 *
 * Represents a product in a shopping cart.
 *
 * Business Rules:
 * - Quantity must be positive
 * - Price snapshot preserved at time of adding
 * - Product ID required, variant ID optional
 */
export class CartItemEntity {
  private readonly _id: CartItemId;
  private readonly _productId: ProductId;
  private readonly _productName: string;
  private readonly _variantId: string | null;
  private _quantity: Quantity;
  private readonly _unitPrice: Money;

  private constructor(props: {
    id: CartItemId;
    productId: ProductId;
    productName: string;
    variantId: string | null;
    quantity: Quantity;
    unitPrice: Money;
  }) {
    this._id = props.id;
    this._productId = props.productId;
    this._productName = props.productName;
    this._variantId = props.variantId;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
  }

  /**
   * Create new cart item
   */
  static create(props: {
    productId: string;
    productName: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
  }): CartItemEntity {
    return new CartItemEntity({
      id: CartItemId.generate(),
      productId: ProductId.fromString(props.productId),
      productName: props.productName,
      variantId: props.variantId,
      quantity: Quantity.create(props.quantity),
      unitPrice: Money.fromAmount(props.unitPrice),
    });
  }

  /**
   * Reconstitute from persistence
   */
  static fromPersistence(data: {
    id: string;
    productId: string;
    productName: string;
    variantId: string | null;
    quantity: number;
    unitPrice: number;
  }): CartItemEntity {
    return new CartItemEntity({
      id: CartItemId.fromString(data.id),
      productId: ProductId.fromString(data.productId),
      productName: data.productName,
      variantId: data.variantId,
      quantity: Quantity.create(data.quantity),
      unitPrice: Money.fromAmount(data.unitPrice),
    });
  }

  /**
   * Update quantity
   */
  updateQuantity(newQuantity: number): void {
    this._quantity = Quantity.create(newQuantity);
  }

  /**
   * Increment quantity by amount
   */
  incrementQuantity(amount: number): void {
    const newQuantity = this._quantity.value + amount;
    this._quantity = Quantity.create(newQuantity);
  }

  /**
   * Calculate total for this item
   */
  calculateTotal(): Money {
    return this._unitPrice.multiply(this._quantity.value);
  }

  /**
   * Check if this item matches product+variant
   */
  matches(productId: string, variantId: string | null): boolean {
    const productMatches = this._productId.value === productId;
    const variantMatches = this._variantId === variantId;
    return productMatches && variantMatches;
  }

  // Getters
  get id(): CartItemId {
    return this._id;
  }

  get productId(): ProductId {
    return this._productId;
  }

  get productName(): string {
    return this._productName;
  }

  get variantId(): string | null {
    return this._variantId;
  }

  get quantity(): Quantity {
    return this._quantity;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }
}
