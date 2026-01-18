import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProductTypeDto {
  @ApiPropertyOptional({
    example: 'Clothing',
    description: 'Product type name',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product type is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
