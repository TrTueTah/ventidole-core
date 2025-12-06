import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommentDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Comment ID' })
  id: string;

  @ApiProperty({
    example: 'This is a comment',
    description: 'Comment content',
  })
  content: string;

  @ApiProperty({ example: 'clxxxxxxx', description: 'Post ID' })
  postId: string;

  @ApiProperty({ example: 'clxxxxxxx', description: 'User ID' })
  userId: string;

  @ApiProperty({
    example: {
      id: 'clxxxxxxx',
      username: 'john_doe',
      avatarUrl: 'https://example.com/avatar.jpg',
    },
    description: 'User information',
  })
  user: {
    id: string;
    username: string;
    avatarUrl?: string;
  };

  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Parent comment ID (for nested replies)',
  })
  parentId?: string | null;

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
