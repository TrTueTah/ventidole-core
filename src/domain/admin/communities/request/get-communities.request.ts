import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum CommunitySortBy {
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetCommunitiesRequest extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: CommunitySortBy,
    example: CommunitySortBy.CREATED_AT,
  })
  @IsEnum(CommunitySortBy)
  @IsOptional()
  sortBy?: CommunitySortBy = CommunitySortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
