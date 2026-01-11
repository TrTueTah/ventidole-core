import { ApiProperty } from '@nestjs/swagger';
import { CartItemResponseDto } from './cart-item-response.dto';

/**
 * Cart Response DTO
 *
 * Response DTO for user's shopping cart.
 */
export class CartResponseDto {
  @ApiProperty({ example: 'cart_abc123' })
  id: string;

  @ApiProperty({ example: 'user_xyz789' })
  userId: string;

  @ApiProperty({ example: 'ACTIVE', enum: ['ACTIVE', 'CHECKED_OUT', 'ABANDONED'] })
  status: string;

  @ApiProperty({ type: [CartItemResponseDto] })
  items: CartItemResponseDto[];

  @ApiProperty({ example: 3, description: 'Number of distinct items' })
  itemCount: number;

  @ApiProperty({ example: 5, description: 'Total quantity of all items' })
  totalQuantity: number;

  @ApiProperty({ example: 125000, description: 'Total amount in VND' })
  totalAmount: number;

  @ApiProperty({ example: '2024-01-15T08:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T14:45:00Z' })
  updatedAt: Date;
}
