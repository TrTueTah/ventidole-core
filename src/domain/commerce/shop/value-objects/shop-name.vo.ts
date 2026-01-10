/**
 * Shop Name Value Object
 *
 * Validates shop name.
 */
export class ShopName {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value.trim();
  }

  static create(value: string): ShopName {
    return new ShopName(value);
  }

  private validate(value: string): void {
    const trimmed = value.trim();

    if (trimmed.length === 0) {
      throw new Error('Shop name cannot be empty');
    }

    if (trimmed.length > 100) {
      throw new Error('Shop name cannot exceed 100 characters');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: ShopName): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
