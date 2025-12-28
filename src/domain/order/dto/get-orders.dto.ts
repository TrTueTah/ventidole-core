import { ApiProperty } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatus } from 'src/db/prisma/enums';

export class GetOrdersDto extends PaginationDto {
  @ApiProperty({
    description: 'Filter by order status',
    enum: OrderStatus,
    required: false,
  })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;
}
