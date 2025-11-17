import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum IdolSortBy {
  CREATED_AT = 'createdAt',
  STAGE_NAME = 'stageName',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetIdolsRequest extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by username',
    type: String,
    example: '',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: IdolSortBy,
    example: IdolSortBy.CREATED_AT,
  })
  @IsEnum(IdolSortBy)
  @IsOptional()
  sortBy?: IdolSortBy = IdolSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}