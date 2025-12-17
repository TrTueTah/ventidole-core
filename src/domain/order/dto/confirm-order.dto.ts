import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export enum PaymentMethod {
  CREDIT = 'CREDIT',
  COD = 'COD',
}

export class OrderItemDto {
  @ApiProperty({ description: 'Product ID', example: 'cm1abc123xyz' })
  @IsNotEmpty()
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Product variant ID (optional)',
    example: 'cm1variant123',
    required: false,
  })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({ description: 'Quantity', example: 2, minimum: 1 })
  @IsNotEmpty()
  @IsInt()
  @Min(1)
  quantity: number;
}

export class ConfirmOrderDto {
  @ApiProperty({
    description: 'Order items',
    type: [OrderItemDto],
    example: [
      { productId: 'cm1abc123xyz', quantity: 2 },
      { productId: 'cm1def456uvw', variantId: 'cm1variant789', quantity: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT,
  })
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiProperty({
    description: 'Shipping address ID',
    example: 'cm1address123',
  })
  @IsNotEmpty()
  @IsString()
  shippingAddressId: string;
}
