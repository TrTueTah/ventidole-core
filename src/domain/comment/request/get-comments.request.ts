import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '@shared/dto/pagination-request.dto';

export enum CommentSortBy {
  CREATED_AT = 'createdAt',
  LIKES_COUNT = 'likesCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetCommentsRequest extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: CommentSortBy,
    example: CommentSortBy.CREATED_AT,
  })
  @IsEnum(CommentSortBy)
  @IsOptional()
  sortBy?: CommentSortBy = CommentSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
