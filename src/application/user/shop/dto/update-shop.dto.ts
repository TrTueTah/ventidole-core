import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Shop DTO
 *
 * Request DTO for updating a shop.
 */
export class UpdateShopDto {
  @ApiPropertyOptional({ example: 'Updated Shop Name' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-logo.jpg' })
  @IsOptional()
  @IsString()
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'https://example.com/new-banner.jpg' })
  @IsOptional()
  @IsString()
  bannerUrl?: string;
}
