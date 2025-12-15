import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsOptional, IsString } from 'class-validator';

export class GetShopProductsDto extends PaginationDto {
  @ApiPropertyOptional({
    required: false,
    example: 'T-Shirt',
    description: 'Search products by name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
