import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminPostDto {
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

  @ApiProperty({
    example: 'clxxxxxxx',
    description: 'Author ID',
  })
  authorId: string;

  @ApiProperty({
    example: 'John Doe',
    description: 'Author name',
  })
  authorName: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Author avatar URL',
  })
  authorAvatarUrl?: string | null;

  @ApiProperty({
    example: 'clxxxxxxx',
    description: 'Community ID',
  })
  communityId: string;

  @ApiProperty({
    example: 'K-Pop Fans Community',
    description: 'Community name',
  })
  communityName: string;

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
