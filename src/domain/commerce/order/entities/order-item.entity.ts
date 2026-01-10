import { Money } from '../value-objects/money.vo';

/**
 * Order Item Entity
 *
 * Represents a single item (product + quantity) in an order.
 *
 * Business rules:
 * - Each item has a product ID and quantity
 * - Price is captured at time of order (immutable)
 * - Quantity must be positive
 * - Total = unitPrice * quantity
 */
export class OrderItem {
  private readonly _productId: string;
  private readonly _productName: string;
  private readonly _quantity: number;
  private readonly _unitPrice: Money;
  private readonly _total: Money;

  private constructor(props: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: Money;
  }) {
    this.validate(props);
    this._productId = props.productId;
    this._productName = props.productName;
    this._quantity = props.quantity;
    this._unitPrice = props.unitPrice;
    this._total = props.unitPrice.multiply(props.quantity);
  }

  /**
   * Factory method: Create new order item
   */
  static create(props: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number; // Amount in smallest unit
  }): OrderItem {
    return new OrderItem({
      productId: props.productId,
      productName: props.productName,
      quantity: props.quantity,
      unitPrice: Money.fromAmount(props.unitPrice),
    });
  }

  /**
   * Factory method: Reconstitute from persistence
   */
  static fromPersistence(props: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: number;
  }): OrderItem {
    return new OrderItem({
      productId: props.productId,
      productName: props.productName,
      quantity: props.quantity,
      unitPrice: Money.fromAmount(props.unitPrice),
    });
  }

  private validate(props: {
    productId: string;
    productName: string;
    quantity: number;
    unitPrice: Money;
  }): void {
    if (!props.productId || props.productId.trim().length === 0) {
      throw new Error('Product ID cannot be empty');
    }

    if (!props.productName || props.productName.trim().length === 0) {
      throw new Error('Product name cannot be empty');
    }

    if (props.quantity <= 0) {
      throw new Error('Quantity must be positive');
    }

    if (!Number.isInteger(props.quantity)) {
      throw new Error('Quantity must be an integer');
    }
  }

  // Getters
  get productId(): string {
    return this._productId;
  }

  get productName(): string {
    return this._productName;
  }

  get quantity(): number {
    return this._quantity;
  }

  get unitPrice(): Money {
    return this._unitPrice;
  }

  get total(): Money {
    return this._total;
  }
}
