import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';

enum CartAction {
  INCREASE = 'increase',
  DECREASE = 'decrease',
}

export class AddToCartDto {
  @ApiProperty({
    example: 'clxxxxxxx',
    description: 'Product ID',
  })
  @IsString()
  productId: string;

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Product variant ID (optional)',
  })
  @IsOptional()
  @IsString()
  variantId?: string;

  @ApiProperty({
    example: 1,
    description: 'Quantity to add or remove',
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({
    example: 'increase',
    description: 'Action to perform: increase or decrease quantity',
    enum: CartAction,
  })
  @IsEnum(CartAction)
  action: CartAction;
}
