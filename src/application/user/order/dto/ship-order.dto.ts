import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Ship Order DTO
 *
 * Request DTO for shipping an order.
 */
export class ShipOrderDto {
  @ApiPropertyOptional({ example: 'TRACK123456789' })
  @IsOptional()
  @IsString()
  trackingNumber?: string;
}
