import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsOptional, IsString } from 'class-validator';

export class GetAdminPostsDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'content',
    description: 'Search by post content',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    example: 'true',
    description: 'Filter by active status',
  })
  @IsString()
  @IsOptional()
  isActive?: string;

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Filter by author ID',
  })
  @IsString()
  @IsOptional()
  authorId?: string;

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Filter by community ID',
  })
  @IsString()
  @IsOptional()
  communityId?: string;

  @ApiPropertyOptional({
    example: 'createdAt',
    description: 'Sort by field',
    enum: ['createdAt', 'updatedAt', 'likeCount', 'commentCount', 'viewCount'],
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
