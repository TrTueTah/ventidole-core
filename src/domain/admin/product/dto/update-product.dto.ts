import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateProductTypeInlineDto } from './create-product.dto';
import { UpdateVariantDto } from './variant.dto';

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
    description: 'Product Type ID (use this OR newType, not both)',
  })
  @IsString()
  @IsOptional()
  typeId?: string;

  @ApiPropertyOptional({
    description:
      'Create a new product type inline (use this OR typeId, not both)',
    type: () => CreateProductTypeInlineDto,
  })
  @ValidateNested()
  @Type(() => CreateProductTypeInlineDto)
  @IsOptional()
  newType?: CreateProductTypeInlineDto;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the product is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description:
      'Product variants. Variants with id will be updated, without id will be created. Existing variants not in this list will be soft-deleted.',
    type: () => [UpdateVariantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateVariantDto)
  @IsOptional()
  variants?: UpdateVariantDto[];
}
