import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsEnum, IsOptional } from 'class-validator';

export enum GroupSortBy {
  CREATED_AT = 'createdAt',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetGroupsRequest extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: GroupSortBy,
    example: GroupSortBy.CREATED_AT,
  })
  @IsEnum(GroupSortBy)
  @IsOptional()
  sortBy?: GroupSortBy = GroupSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
