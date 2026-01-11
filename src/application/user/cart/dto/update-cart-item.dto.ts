import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min, Max } from 'class-validator';

/**
 * Update Cart Item DTO
 *
 * Request DTO for updating an item's quantity in the cart.
 */
export class UpdateCartItemDto {
  @ApiProperty({
    description: 'New quantity',
    example: 3,
    minimum: 1,
    maximum: 999,
  })
  @IsInt()
  @Min(1)
  @Max(999)
  quantity: number;
}
