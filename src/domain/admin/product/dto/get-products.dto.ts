import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsOptional, IsString } from 'class-validator';

export class GetProductsDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'shirt',
    description: 'Search by product name',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Filter by shop ID',
  })
  @IsString()
  @IsOptional()
  shopId?: string;

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Filter by product type ID',
  })
  @IsString()
  @IsOptional()
  typeId?: string;

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
    enum: ['createdAt', 'updatedAt', 'name', 'price', 'stock'],
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
