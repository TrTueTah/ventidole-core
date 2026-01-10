import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Mark Order As Paid DTO
 *
 * Request DTO for marking an order as paid.
 */
export class MarkOrderAsPaidDto {
  @ApiProperty({ example: 'pay_123456789' })
  @IsString()
  paymentId: string;
}
