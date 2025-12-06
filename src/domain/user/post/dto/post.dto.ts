import { ApiProperty } from '@nestjs/swagger';

export class PostDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Post ID' })
  id: string;

  @ApiProperty({
    example: 'This is my post content',
    description: 'Post content',
  })
  content: string;

  @ApiProperty({
    example: [
      'https://res.cloudinary.com/dsc9afexw/image/upload/v1762054385/kt1-6905e9f7e7ad5_z2wfqq.jpg',
      'https://res.cloudinary.com/dsc9afexw/image/upload/v1763017396/BTS-scaled_wdnws5.jpg',
    ],
    description: 'Array of media URLs',
    type: [String],
    required: false,
    nullable: true,
  })
  mediaUrls?: string[] | null;

  @ApiProperty({ example: 100, description: 'Number of likes' })
  likeCount: number;

  @ApiProperty({ example: 25, description: 'Number of comments' })
  commentCount: number;

  @ApiProperty({ example: 500, description: 'Number of views' })
  viewCount: number;

  @ApiProperty({ example: 'clxxxxxxx', description: 'Author ID' })
  authorId: string;

  @ApiProperty({
    example: {
      id: 'clxxxxxxx',
      username: 'john_doe',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    description: 'Author information',
  })
  author: {
    id: string;
    username: string;
    avatarUrl?: string;
  };

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
