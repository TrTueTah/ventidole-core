import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum ProductSortBy {
  CREATED_AT = 'createdAt',
  NAME = 'name',
  UPDATED_AT = 'updatedAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetProductsRequest extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ProductSortBy,
    example: ProductSortBy.CREATED_AT,
  })
  @IsEnum(ProductSortBy)
  @IsOptional()
  sortBy?: ProductSortBy = ProductSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  order?: SortOrder = SortOrder.DESC;

  @ApiPropertyOptional({
    description: 'Filter by category ID',
    example: 'cmi64epuq0000p5wb5q352lws',
    type: String,
  })
  @IsString()
  @IsOptional()
  category_id?: string;

  @ApiPropertyOptional({
    description: 'Search by product name',
    example: 'BTS',
    type: String,
  })
  @IsString()
  @IsOptional()
  search?: string;
}