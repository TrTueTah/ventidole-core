import {
  IsString,
  IsArray,
  IsNumber,
  IsEnum,
  ValidateNested,
  Min,
  ArrayMinSize,
} from 'class-validator';
import { Type } from 'class-transformer';

/**
 * Order Item DTO
 */
export class OrderItemDto {
  @IsString()
  productId: string;

  @IsString()
  productName: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

/**
 * Shipping Address DTO
 */
export class ShippingAddressDto {
  @IsString()
  recipientName: string;

  @IsString()
  phoneNumber: string;

  @IsString()
  addressLine: string;

  @IsString()
  ward: string;

  @IsString()
  district: string;

  @IsString()
  province: string;

  @IsString()
  postalCode: string;
}

/**
 * Create Order DTO
 *
 * Request DTO for creating a new order.
 */
export class CreateOrderDto {
  @IsString()
  shopId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress: ShippingAddressDto;

  @IsEnum(['CREDIT', 'COD'])
  paymentMethod: 'CREDIT' | 'COD';
}
