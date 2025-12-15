import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CartItemProductDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Product ID' })
  id: string;

  @ApiProperty({
    example: 'Official T-Shirt',
    description: 'Product name',
  })
  name: string;

  @ApiProperty({
    example: 29.99,
    description: 'Product price',
  })
  price: number;

  @ApiProperty({
    example: 100,
    description: 'Product stock quantity',
  })
  stock: number;

  @ApiPropertyOptional({
    example: ['https://example.com/image1.jpg'],
    description: 'Product media URLs',
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mediaUrls?: any;
}

export class CartItemVariantDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Variant ID' })
  id: string;

  @ApiProperty({
    example: 'Size M - Red',
    description: 'Variant name',
  })
  name: string;

  @ApiProperty({
    example: 29.99,
    description: 'Variant price',
  })
  price: number;

  @ApiProperty({
    example: 50,
    description: 'Variant stock quantity',
  })
  stock: number;
}

export class CartItemDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Cart item ID' })
  id: string;

  @ApiProperty({
    example: 2,
    description: 'Quantity',
  })
  quantity: number;

  @ApiProperty({
    description: 'Product information',
    type: () => CartItemProductDto,
  })
  product: CartItemProductDto;

  @ApiPropertyOptional({
    description: 'Variant information',
    type: () => CartItemVariantDto,
  })
  variant?: CartItemVariantDto | null;

  @ApiProperty({
    example: false,
    description: 'Whether the product/variant is out of stock',
  })
  isOutOfStock: boolean;

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

export class CartDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Cart ID' })
  id: string;

  @ApiProperty({
    description: 'Cart items',
    type: [CartItemDto],
  })
  items: CartItemDto[];

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
