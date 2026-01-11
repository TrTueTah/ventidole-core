import { ApiProperty } from '@nestjs/swagger';

/**
 * Cart Item Response DTO
 *
 * Response DTO for a single cart item.
 */
export class CartItemResponseDto {
  @ApiProperty({ example: 'item_abc123' })
  id: string;

  @ApiProperty({ example: 'prod_xyz789' })
  productId: string;

  @ApiProperty({ example: 'K-Pop Album - Limited Edition' })
  productName: string;

  @ApiProperty({ example: 'variant_def456', nullable: true })
  variantId: string | null;

  @ApiProperty({ example: 2 })
  quantity: number;

  @ApiProperty({ example: 25000, description: 'Unit price in VND' })
  unitPrice: number;

  @ApiProperty({ example: 50000, description: 'Total for this item (unitPrice * quantity)' })
  total: number;
}
