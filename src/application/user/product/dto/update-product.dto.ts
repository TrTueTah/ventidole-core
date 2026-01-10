import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Update Product DTO
 *
 * Request DTO for updating a product.
 */
export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Updated Official T-Shirt' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: 180000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  basePrice?: number;

  @ApiPropertyOptional({
    example: ['https://example.com/new-image.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  imageUrls?: string[];

  @ApiPropertyOptional({ example: 'Merchandise' })
  @IsOptional()
  @IsString()
  category?: string;
}

/**
 * Update Variant DTO
 */
export class UpdateVariantDto {
  @ApiPropertyOptional({ example: 'Medium' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 160000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;
}

/**
 * Update Stock DTO
 */
export class UpdateStockDto {
  @ApiPropertyOptional({ example: 25 })
  @IsNumber()
  @Min(0)
  stock: number;
}
