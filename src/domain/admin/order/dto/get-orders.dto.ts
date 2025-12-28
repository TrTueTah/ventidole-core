import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { OrderStatus, PaymentTransactionStatus } from 'src/db/prisma/enums';

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
    example: 'PENDING_PAYMENT',
    description: 'Filter by order status',
    enum: OrderStatus,
  })
  @IsEnum(OrderStatus)
  @IsOptional()
  orderStatus?: OrderStatus;

  @ApiPropertyOptional({
    example: 'PAID',
    description: 'Filter by payment status',
    enum: PaymentTransactionStatus,
  })
  @IsEnum(PaymentTransactionStatus)
  @IsOptional()
  paymentStatus?: PaymentTransactionStatus;

  @ApiPropertyOptional({
    example: 'CREDIT',
    description: 'Filter by payment method',
    enum: ['CREDIT', 'COD'],
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
