import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { PaginationDto } from '@shared/dto/pagination-request.dto';

export class GetCommunitiesDto extends PaginationDto {
  @ApiPropertyOptional({
    required: false,
    example: 'nestjs',
    description: 'Filter communities by search keyword (name or description)',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    required: false,
    example: 'true',
    description: 'Filter to show only joined communities',
  })
  @IsOptional()
  @IsString()
  joined?: string;
}
