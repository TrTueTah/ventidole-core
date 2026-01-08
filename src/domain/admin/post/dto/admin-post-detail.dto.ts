import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminPostDetailDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Post ID' })
  id: string;

  @ApiProperty({
    example: 'This is a post content',
    description: 'Post content',
  })
  content: string;

  @ApiPropertyOptional({
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
    description: 'Post media URLs',
  })
  mediaUrls?: any | null;

  @ApiProperty({
    example: 100,
    description: 'Number of likes',
  })
  likeCount: number;

  @ApiProperty({
    example: 50,
    description: 'Number of comments',
  })
  commentCount: number;

  @ApiProperty({
    example: 200,
    description: 'Number of views',
  })
  viewCount: number;

  @ApiProperty({
    example: true,
    description: 'Whether the post is active',
  })
  isActive: boolean;

  @ApiPropertyOptional({
    example: {},
    description: 'Post metadata',
  })
  metadata?: any | null;

  @ApiProperty({
    example: {
      id: 'clxxxxxxx',
      username: 'johndoe',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    description: 'Post author information',
  })
  author: {
    id: string;
    username: string;
    avatarUrl?: string | null;
  };

  @ApiProperty({
    example: {
      id: 'clxxxxxxx',
      name: 'K-Pop Fans Community',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    description: 'Community information',
  })
  community: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };

  @ApiProperty({
    example: [
      {
        id: 'clxxxxxxx',
        reason: 'Inappropriate content',
        reportedBy: 'clxxxxxxx',
        reporterName: 'janedoe',
        createdAt: '2024-01-01T00:00:00.000Z',
      },
    ],
    description: 'List of reports for this post',
  })
  reports: Array<{
    id: string;
    reason?: string | null;
    reportedBy: string;
    reporterName: string;
    createdAt: Date;
  }>;

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
}
