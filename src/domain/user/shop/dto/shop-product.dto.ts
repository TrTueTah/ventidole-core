import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShopProductDto {
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
    example: '2023-01-01T00:00:00.000Z',
    description: 'Created at',
  })
  createdAt: Date;
}
