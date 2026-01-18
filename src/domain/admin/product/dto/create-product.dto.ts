import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { CreateVariantDto } from './variant.dto';

export class CreateProductTypeInlineDto {
  @ApiProperty({
    example: 'Clothing',
    description: 'Product type name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}

export class CreateProductDto {
  @ApiProperty({
    example: 'Official T-Shirt',
    description: 'Product name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Official merchandise T-Shirt',
    description: 'Product description',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    example: 29.99,
    description: 'Product price',
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    example: 100,
    description: 'Stock quantity',
  })
  @IsNumber()
  @Min(0)
  stock: number;

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

  @ApiProperty({
    example: 'clxxxxxxx',
    description: 'Shop ID',
  })
  @IsString()
  @IsNotEmpty()
  shopId: string;

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
    description: 'Product variants',
    type: () => [CreateVariantDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  @IsOptional()
  variants?: CreateVariantDto[];
}
