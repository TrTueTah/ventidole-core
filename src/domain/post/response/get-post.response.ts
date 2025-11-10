import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostDto {
  @ApiProperty({
    description: 'Post ID',
    example: 'post-clx123abc',
    type: String,
  })
  postId: string;

  @ApiProperty({
    description: 'User ID who created the post',
    example: 'user-123',
    type: String,
  })
  userId: string;

  @ApiProperty({
    description: 'Display name of the author',
    example: 'John Doe',
    type: String,
  })
  displayName: string;

  @ApiPropertyOptional({
    description: 'User email',
    example: 'john@example.com',
    type: String,
  })
  userEmail?: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://storage.googleapis.com/bucket/avatars/user-123.jpg',
    type: String,
  })
  userAvatar?: string;

  @ApiProperty({
    description: 'Post content',
    example: 'Beautiful sunset at the beach! 🌅 #nature #sunset',
    type: String,
  })
  content: string;

  @ApiProperty({
    description: 'Media URLs',
    type: [String],
    example: ['https://storage.googleapis.com/bucket/image1.jpg'],
  })
  mediaUrls: string[];

  @ApiProperty({
    description: 'Hashtags',
    type: [String],
    example: ['nature', 'sunset'],
  })
  hashtags: string[];

  @ApiProperty({
    description: 'Mentioned user IDs',
    type: [String],
    example: ['user-id-1'],
  })
  mentions: string[];

  @ApiPropertyOptional({
    description: 'Location',
    example: 'Santa Monica Beach, CA',
    type: String,
  })
  location?: string;

  @ApiProperty({
    description: 'Post visibility',
    example: 'public',
    type: String,
  })
  visibility: string;

  @ApiProperty({
    description: 'Likes count',
    example: 10,
    type: Number,
  })
  likesCount: number;

  @ApiProperty({
    description: 'Comments count',
    example: 5,
    type: Number,
  })
  commentsCount: number;

  @ApiProperty({
    description: 'Shares count',
    example: 2,
    type: Number,
  })
  sharesCount: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-05T10:30:00Z',
    type: String,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-11-05T10:30:00Z',
    type: String,
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Deletion status',
    example: false,
    type: Boolean,
  })
  isDeleted: boolean;
}

export class GetPostResponse extends PostDto {}
