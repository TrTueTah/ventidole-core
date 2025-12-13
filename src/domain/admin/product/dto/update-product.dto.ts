import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateProductDto {
  @ApiPropertyOptional({
    example: 'Official T-Shirt',
    description: 'Product name',
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    example: 'Official merchandise T-Shirt',
    description: 'Product description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 29.99,
    description: 'Product price',
  })
  @IsNumber()
  @IsPositive()
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Stock quantity',
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  stock?: number;

  @ApiPropertyOptional({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    description: 'Product media URLs',
  })
  @IsArray()
  @IsOptional()
  mediaUrls?: string[];

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Product Type ID',
  })
  @IsString()
  @IsOptional()
  typeId?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
