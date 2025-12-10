import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsOptional, IsString } from 'class-validator';

export class GetCommunitiesDto extends PaginationDto {
  @ApiPropertyOptional({
    example: 'K-Pop',
    description: 'Search by community name or description',
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
    example: 'createdAt',
    description: 'Sort by field',
    enum: ['createdAt', 'updatedAt', 'name'],
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
