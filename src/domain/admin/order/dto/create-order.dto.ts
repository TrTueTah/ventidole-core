import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { OrderStatus } from 'src/db/prisma/enums';

export class CreateOrderItemDto {
  @ApiProperty({
    example: 'clxxxxxxx',
    description: 'Product ID',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Variant ID',
  })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({
    example: 29.99,
    description: 'Price',
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    example: 2,
    description: 'Quantity',
  })
  @IsNumber()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({
    example: 'clxxxxxxx',
    description: 'User ID',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    example: 59.98,
    description: 'Total amount',
  })
  @IsNumber()
  @IsPositive()
  totalAmount: number;

  @ApiProperty({
    example: 'pending',
    description: 'Order status',
    enum: OrderStatus,
    default: OrderStatus.pending,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiProperty({
    example: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
    },
    description: 'Shipping address',
  })
  @IsObject()
  @IsNotEmpty()
  shippingAddress: object;

  @ApiProperty({
    example: 'credit_card',
    description: 'Payment method',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  paymentMethod: string;

  @ApiProperty({
    example: [
      {
        productId: 'clxxxxxxx',
        variantId: 'clxxxxxxx',
        price: 29.99,
        quantity: 2,
      },
    ],
    description: 'Order items',
    type: [CreateOrderItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items: CreateOrderItemDto[];
}
