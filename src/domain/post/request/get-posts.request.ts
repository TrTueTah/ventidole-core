import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { PostVisibility } from './create-post.request';

export enum PostSortBy {
  CREATED_AT = 'createdAt',
  LIKES_COUNT = 'likesCount',
  COMMENTS_COUNT = 'commentsCount',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export class GetPostsRequest extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by user ID',
    example: 'user-123',
  })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({
    description: 'Filter by hashtag',
    example: 'nature',
  })
  @IsString()
  @IsOptional()
  hashtag?: string;

  @ApiPropertyOptional({
    description: 'Filter by visibility',
    enum: PostVisibility,
    example: PostVisibility.PUBLIC,
  })
  @IsEnum(PostVisibility)
  @IsOptional()
  visibility?: PostVisibility;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: PostSortBy,
    example: PostSortBy.CREATED_AT,
  })
  @IsEnum(PostSortBy)
  @IsOptional()
  sortBy?: PostSortBy = PostSortBy.CREATED_AT;

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: SortOrder,
    example: SortOrder.DESC,
  })
  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder = SortOrder.DESC;
}
