import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Create Shop DTO
 *
 * Request DTO for creating a new shop.
 */
export class CreateShopDto {
  @ApiProperty({ example: 'My Official Shop' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Official merchandise and exclusive items' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.jpg' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/banner.jpg' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;
}
