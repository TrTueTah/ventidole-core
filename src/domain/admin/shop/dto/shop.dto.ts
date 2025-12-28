import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ShopCommunityDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Community ID' })
  id: string;

  @ApiProperty({
    example: 'My Community',
    description: 'Community name',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
  })
  avatarUrl?: string | null;
}

export class ShopOwnerDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'User ID' })
  id: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username',
  })
  username: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
  })
  avatarUrl?: string | null;
}

export class ShopDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Shop ID' })
  id: string;

  @ApiProperty({
    example: 'My Shop',
    description: 'Shop name',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'A shop description',
    description: 'Shop description',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Shop avatar URL',
  })
  avatarUrl?: string | null;

  @ApiProperty({
    description: 'Community information',
    type: () => ShopCommunityDto,
  })
  community: ShopCommunityDto;

  @ApiPropertyOptional({
    description: 'Shop owner information',
    type: () => ShopOwnerDto,
  })
  owner?: ShopOwnerDto | null;

  @ApiPropertyOptional({
    example: 42,
    description: 'Number of products in shop',
  })
  productCount?: number;

  @ApiProperty({
    example: true,
    description: 'Whether the shop is active',
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
