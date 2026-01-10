import {
  IsString,
  IsOptional,
  IsArray,
  IsNumber,
  ValidateNested,
  Min,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Product Variant DTO
 */
export class ProductVariantDto {
  @ApiProperty({ example: 'Small' })
  @IsString()
  name: string;

  @ApiProperty({ example: 100000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 10 })
  @IsNumber()
  @Min(0)
  stock: number;
}

/**
 * Create Product DTO
 *
 * Request DTO for creating a new product.
 */
export class CreateProductDto {
  @ApiProperty({ example: 'shop_123' })
  @IsString()
  shopId: string;

  @ApiProperty({ example: 'Official T-Shirt' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'High quality cotton t-shirt' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 150000 })
  @IsNumber()
  @Min(0)
  basePrice: number;

  @ApiPropertyOptional({
    example: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(10)
  imageUrls?: string[];

  @ApiPropertyOptional({ example: 'Apparel' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    type: [ProductVariantDto],
    example: [
      { name: 'Small', price: 150000, stock: 10 },
      { name: 'Medium', price: 150000, stock: 15 },
    ],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductVariantDto)
  variants?: ProductVariantDto[];
}
