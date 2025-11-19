import { ApiProperty } from '@nestjs/swagger';
import { ProductCategoryDto, ProductVariantDto } from './get-product.response';

export class CreateProductResponse {
  @ApiProperty({
    example: 'clz1234567890',
    description: 'Created product ID',
  })
  id: string;

  @ApiProperty({
    example: 'BTS Official Light Stick',
    description: 'Product name',
  })
  name: string;

  @ApiProperty({
    example: 'Official BTS light stick for concerts and fan events.',
    description: 'Product description',
  })
  description: string | null;

  @ApiProperty({
    example: 'https://res.cloudinary.com/bucket/bts-lightstick.jpg',
    description: 'Product cover image URL',
  })
  cover_image: string | null;

  @ApiProperty({
    description: 'Product category',
    type: ProductCategoryDto,
  })
  category: ProductCategoryDto;

  @ApiProperty({
    description: 'Created product variants',
    type: [ProductVariantDto],
  })
  variants: ProductVariantDto[];

  @ApiProperty({
    example: '2023-11-19T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  constructor(product: any) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.cover_image = product.cover_image;
    this.category = new ProductCategoryDto(product.category);
    this.variants = product.variants ? product.variants.map((variant: any) => new ProductVariantDto(variant)) : [];
    this.createdAt = product.createdAt;
  }
}