import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsOptional, IsString } from 'class-validator';

export class GetProductTypesDto extends PaginationDto {
  @ApiPropertyOptional({
    description: 'Search by name',
    example: 'Clothing',
  })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: 'true',
  })
  @IsString()
  @IsOptional()
  isActive?: string;
}
