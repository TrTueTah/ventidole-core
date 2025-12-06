import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommunityDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Community ID' })
  id: string;

  @ApiProperty({
    example: 'K-Pop Fans Community',
    description: 'Community name',
  })
  name: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Community avatar URL',
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/background.jpg',
    description: 'Community background URL',
  })
  backgroundUrl?: string | null;

  @ApiPropertyOptional({
    example: 'A community for K-Pop fans',
    description: 'Community description',
  })
  description?: string | null;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the current user has joined this community',
  })
  isJoined?: boolean;
}
