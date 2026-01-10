import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Cancel Order DTO
 *
 * Request DTO for canceling an order.
 */
export class CancelOrderDto {
  @ApiPropertyOptional({ example: 'Customer changed mind' })
  @IsOptional()
  @IsString()
  reason?: string;
}
