/**
 * Product Name Value Object
 *
 * Validates product name.
 */
export class ProductName {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value.trim();
  }

  static create(value: string): ProductName {
    return new ProductName(value);
  }

  private validate(value: string): void {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Product name cannot be empty');
    }

    if (trimmed.length > 200) {
      throw new Error('Product name cannot exceed 200 characters');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: ProductName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
