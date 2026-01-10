/**
 * Shipping Address Value Object
 *
 * Represents a complete shipping address.
 *
 * Business rules:
 * - All fields are required
 * - Phone number must be valid Vietnamese format
 */
export class ShippingAddress {
  private readonly _recipientName: string;
  private readonly _phoneNumber: string;
  private readonly _addressLine: string;
  private readonly _ward: string;
  private readonly _district: string;
  private readonly _province: string;
  private readonly _postalCode: string;

  private constructor(props: {
    recipientName: string;
    phoneNumber: string;
    addressLine: string;
    ward: string;
    district: string;
    province: string;
    postalCode: string;
  }) {
    this.validate(props);
    this._recipientName = props.recipientName;
    this._phoneNumber = props.phoneNumber;
    this._addressLine = props.addressLine;
    this._ward = props.ward;
    this._district = props.district;
    this._province = props.province;
    this._postalCode = props.postalCode;
  }

  static create(props: {
    recipientName: string;
    phoneNumber: string;
    addressLine: string;
    ward: string;
    district: string;
    province: string;
    postalCode: string;
  }): ShippingAddress {
    return new ShippingAddress(props);
  }

  private validate(props: {
    recipientName: string;
    phoneNumber: string;
    addressLine: string;
    ward: string;
    district: string;
    province: string;
    postalCode: string;
  }): void {
    if (!props.recipientName || props.recipientName.trim().length === 0) {
      throw new Error('Recipient name cannot be empty');
    }

    if (!props.phoneNumber || props.phoneNumber.trim().length === 0) {
      throw new Error('Phone number cannot be empty');
    }

    // Vietnamese phone number validation (basic)
    const phoneRegex = /^(0|\+84)[0-9]{9,10}$/;
    if (!phoneRegex.test(props.phoneNumber.replace(/\s/g, ''))) {
      throw new Error('Invalid Vietnamese phone number format');
    }

    if (!props.addressLine || props.addressLine.trim().length === 0) {
      throw new Error('Address line cannot be empty');
    }

    if (!props.ward || props.ward.trim().length === 0) {
      throw new Error('Ward cannot be empty');
    }

    if (!props.district || props.district.trim().length === 0) {
      throw new Error('District cannot be empty');
    }

    if (!props.province || props.province.trim().length === 0) {
      throw new Error('Province cannot be empty');
    }

    if (!props.postalCode || props.postalCode.trim().length === 0) {
      throw new Error('Postal code cannot be empty');
    }
  }

  get recipientName(): string {
    return this._recipientName;
  }

  get phoneNumber(): string {
    return this._phoneNumber;
  }

  get addressLine(): string {
    return this._addressLine;
  }

  get ward(): string {
    return this._ward;
  }

  get district(): string {
    return this._district;
  }

  get province(): string {
    return this._province;
  }

  get postalCode(): string {
    return this._postalCode;
  }

  /**
   * Get full address as single string
   */
  getFullAddress(): string {
    return `${this._addressLine}, ${this._ward}, ${this._district}, ${this._province} ${this._postalCode}`;
  }

  equals(other: ShippingAddress): boolean {
    if (!(other instanceof ShippingAddress)) {
      return false;
    }

    return (
      this._recipientName === other._recipientName &&
      this._phoneNumber === other._phoneNumber &&
      this._addressLine === other._addressLine &&
      this._ward === other._ward &&
      this._district === other._district &&
      this._province === other._province &&
      this._postalCode === other._postalCode
    );
  }

  toString(): string {
    return `${this._recipientName}, ${this._phoneNumber}, ${this.getFullAddress()}`;
  }
}
