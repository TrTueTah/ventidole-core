/**
 * Community Type Value Object
 *
 * Represents the type of community.
 *
 * Business rules:
 * - SOLO: Personal community of a single idol (only owner can post)
 * - GROUP: Community with multiple members (followers can post)
 */
export enum CommunityTypeEnum {
  SOLO = 'SOLO',
  GROUP = 'GROUP',
}

export class CommunityType {
  private readonly _value: CommunityTypeEnum;

  private constructor(value: CommunityTypeEnum) {
    this._value = value;
  }

  static create(value: string): CommunityType {
    const upperValue = value.toUpperCase();

    if (!Object.values(CommunityTypeEnum).includes(upperValue as CommunityTypeEnum)) {
      throw new Error(
        `Invalid community type: ${value}. Must be SOLO or GROUP`,
      );
    }

    return new CommunityType(upperValue as CommunityTypeEnum);
  }

  static solo(): CommunityType {
    return new CommunityType(CommunityTypeEnum.SOLO);
  }

  static group(): CommunityType {
    return new CommunityType(CommunityTypeEnum.GROUP);
  }

  get value(): string {
    return this._value;
  }

  isSolo(): boolean {
    return this._value === CommunityTypeEnum.SOLO;
  }

  isGroup(): boolean {
    return this._value === CommunityTypeEnum.GROUP;
  }

  equals(other: CommunityType): boolean {
    if (!(other instanceof CommunityType)) {
      return false;
    }
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
