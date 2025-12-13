import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ProductShopDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Shop ID' })
  id: string;

  @ApiProperty({
    example: 'My Shop',
    description: 'Shop name',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Shop avatar URL',
  })
  avatarUrl?: string | null;
}

export class ProductTypeDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Product Type ID' })
  id: string;

  @ApiProperty({
    example: 'Clothing',
    description: 'Product type name',
  })
  name: string;
}

export class ProductDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Product ID' })
  id: string;

  @ApiProperty({
    example: 'Official T-Shirt',
    description: 'Product name',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'Official merchandise T-Shirt',
    description: 'Product description',
  })
  description?: string | null;

  @ApiProperty({
    example: 29.99,
    description: 'Product price',
  })
  price: number;

  @ApiProperty({
    example: 100,
    description: 'Stock quantity',
  })
  stock: number;

  @ApiPropertyOptional({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    description: 'Product media URLs',
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mediaUrls?: any;

  @ApiProperty({
    description: 'Shop information',
    type: () => ProductShopDto,
  })
  shop: ProductShopDto;

  @ApiPropertyOptional({
    description: 'Product type information',
    type: () => ProductTypeDto,
  })
  type?: ProductTypeDto | null;

  @ApiProperty({
    example: true,
    description: 'Whether the product is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Created at',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Updated at',
  })
  updatedAt: Date;
}
