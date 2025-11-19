import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductCategoryDto {
  @ApiProperty({
    example: 'clz1234567890',
    description: 'Category ID',
  })
  id: string;

  @ApiProperty({
    example: 'Merchandise',
    description: 'Category name',
  })
  name: string;

  @ApiProperty({
    example: true,
    description: 'Whether the category is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2023-11-19T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  constructor(category: any) {
    this.id = category.id;
    this.name = category.name;
    this.isActive = category.isActive;
    this.createdAt = category.createdAt;
  }
}

export class ProductVariantDto {
  @ApiProperty({
    example: 'cmi64xyz987654321',
    description: 'Variant ID',
  })
  id: string;

  @ApiProperty({
    example: 'Standard Version',
    description: 'Variant name',
  })
  name: string;

  @ApiProperty({
    example: 29.99,
    description: 'Product variant price',
  })
  price_money: number;

  @ApiProperty({
    example: 100,
    description: 'Total supply/stock',
  })
  total_supply: number;

  @ApiProperty({
    example: 85,
    description: 'Remaining supply/stock',
  })
  remaining_supply: number;

  @ApiProperty({
    example: true,
    description: 'Whether the variant is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2023-11-19T10:30:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  constructor(variant: any) {
    this.id = variant.id;
    this.name = variant.name;
    this.price_money = parseFloat(variant.price_money);
    this.total_supply = variant.total_supply;
    this.remaining_supply = variant.remaining_supply;
    this.isActive = variant.isActive;
    this.createdAt = variant.createdAt;
  }
}

export class ProductDto {
  @ApiProperty({
    example: 'clz1234567890',
    description: 'Product ID',
  })
  id: string;

  @ApiProperty({
    example: 'BTS Official Light Stick',
    description: 'Product name',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Official BTS light stick for concerts and fan events. High quality and long-lasting.',
    description: 'Product description',
  })
  description: string | null;

  @ApiPropertyOptional({
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
    description: 'Product variants',
    type: [ProductVariantDto],
  })
  variants: ProductVariantDto[];

  @ApiProperty({
    example: true,
    description: 'Whether the product is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2023-11-19T10:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-11-19T10:30:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiProperty({
    example: 0,
    description: 'Version for optimistic locking',
  })
  version: number;

  constructor(product: any) {
    this.id = product.id;
    this.name = product.name;
    this.description = product.description;
    this.cover_image = product.cover_image;
    this.category = new ProductCategoryDto(product.category);
    this.variants = product.variants ? product.variants.map((variant: any) => new ProductVariantDto(variant)) : [];
    this.isActive = product.isActive;
    this.createdAt = product.createdAt;
    this.updatedAt = product.updatedAt;
    this.version = product.version;
  }
}