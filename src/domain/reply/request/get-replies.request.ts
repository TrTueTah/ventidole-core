import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '@shared/dto/pagination-request.dto';

export enum ReplySortBy {
  CREATED_AT = 'createdAt',
  LIKES_COUNT = 'likesCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetRepliesRequest extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ReplySortBy,
    example: ReplySortBy.CREATED_AT,
  })
  @IsEnum(ReplySortBy)
  @IsOptional()
  sortBy?: ReplySortBy = ReplySortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.ASC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.ASC;
}
