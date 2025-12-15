import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShopProductDto } from './shop-product.dto';

export class ShopListDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Shop ID' })
  id: string;

  @ApiProperty({
    example: 'My Shop',
    description: 'Shop name',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'A description of my shop',
    description: 'Shop description',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Shop avatar URL',
  })
  avatarUrl?: string | null;

  @ApiProperty({ example: 'clxxxxxxx', description: 'Community ID' })
  communityId: string;

  @ApiProperty({
    description: 'Latest 4 products from the shop',
    type: () => [ShopProductDto],
  })
  products: ShopProductDto[];

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
