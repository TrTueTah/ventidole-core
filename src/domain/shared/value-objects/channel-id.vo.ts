import { cuid } from '@paralleldrive/cuid2';

/**
 * Channel ID Value Object
 *
 * Unique identifier for channels.
 */
export class ChannelId {
  private readonly _value: string;

  private constructor(value: string) {
    this.validate(value);
    this._value = value;
  }

  static generate(): ChannelId {
    return new ChannelId(cuid());
  }

  static fromString(value: string): ChannelId {
    return new ChannelId(value);
  }

  private validate(value: string): void {
    if (!value || value.trim().length === 0) {
      throw new Error('ChannelId cannot be empty');
    }
  }

  get value(): string {
    return this._value;
  }

  equals(other: ChannelId): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value;
  }
}
