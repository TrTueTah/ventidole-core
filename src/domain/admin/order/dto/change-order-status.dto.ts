import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator';
import { OrderStatus } from 'src/db/prisma/enums';

export class ChangeOrderStatusDto {
  @ApiProperty({
    example: 'CONFIRMED',
    description: 'New order status',
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  status: OrderStatus;

  @ApiPropertyOptional({
    example: 'Order confirmed by admin',
    description: 'Optional note about status change',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
