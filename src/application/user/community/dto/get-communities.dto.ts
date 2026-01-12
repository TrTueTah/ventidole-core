import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@application/shared/dto/pagination.dto';

/**
 * Get Communities Request DTO
 *
 * Extends PaginationDto with additional filter parameters for community queries.
 */
export class GetCommunitiesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Filter by community type (SOLO or GROUP)',
    example: 'SOLO',
    enum: ['SOLO', 'GROUP'],
  })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({
    description: 'Search term for community name or description',
    example: 'music',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
