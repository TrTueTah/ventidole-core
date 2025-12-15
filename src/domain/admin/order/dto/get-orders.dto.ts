import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus } from 'src/db/prisma/enums';

export class GetOrdersDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'john',
    description: 'Search by order ID, username, or email',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Filter by user ID',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    example: 'pending',
    description: 'Filter by order status',
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  status?: OrderStatus;

  @ApiPropertyOptional({
    example: 'credit_card',
    description: 'Filter by payment method',
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Filter by active status',
  })
  @IsString()
  @IsOptional()
  isActive?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort by field',
    enum: ['createdAt', 'updatedAt', 'totalAmount', 'paidAt'],
  })
  @IsString()
  @IsOptional()
  sortBy?: string;

  @ApiPropertyOptional({
    example: 'desc',
    description: 'Sort order',
    enum: ['asc', 'desc'],
  })
  @IsString()
  @IsOptional()
  sortOrder?: 'asc' | 'desc';
}
