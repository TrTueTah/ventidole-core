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

  @ApiPropertyOptional({
    example: 'https://example.com/background.jpg',
    description: 'Background URL',
  })
  backgroundUrl?: string | null;

  @ApiPropertyOptional({
    example: 'A community description',
    description: 'Description',
  })
  description?: string | null;
}

export class ShopDetailDto {
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
    example: 'clxxxxxxx',
    description: 'Community ID',
  })
  communityId: string;

  @ApiProperty({
    description: 'Community details',
    type: ShopCommunityDto,
  })
  community: ShopCommunityDto;

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

  @ApiPropertyOptional({
    example: { key: 'value' },
    description: 'Additional metadata',
  })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  metadata?: Record<string, any> | null;

  @ApiProperty({
    example: 0,
    description: 'Version',
  })
  version: number;
}
