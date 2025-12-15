import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsOptional, IsString } from 'class-validator';

export class GetShopsDto extends PaginationDto {
  @ApiPropertyOptional({
    required: false,
    example: 'My Shop',
    description: 'Search shops by name',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
