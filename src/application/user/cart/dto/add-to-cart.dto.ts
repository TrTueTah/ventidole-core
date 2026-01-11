import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsInt, IsOptional, Min, Max } from 'class-validator';

/**
 * Add To Cart DTO
 *
 * Request DTO for adding an item to the cart.
 */
export class AddToCartDto {
  @ApiProperty({
    description: 'Product ID',
    example: 'prod_abc123',
  })
  @IsString()
  productId: string;

  @ApiProperty({
    description: 'Product variant ID (optional)',
    example: 'variant_xyz789',
    required: false,
  })
  @IsString()
  @IsOptional()
  variantId?: string;

  @ApiProperty({
    description: 'Quantity to add',
    example: 2,
    minimum: 1,
    maximum: 999,
  })
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}
