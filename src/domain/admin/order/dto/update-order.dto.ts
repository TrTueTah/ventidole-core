import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OrderStatus } from 'src/db/prisma/enums';

export class UpdateOrderDto {
  @ApiPropertyOptional({
    example: 'pending',
    description: 'Order status',
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({
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
  @IsOptional()
  shippingAddress?: object;

  @ApiPropertyOptional({
    example: 'credit_card',
    description: 'Payment method',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  paymentMethod?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the order is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
