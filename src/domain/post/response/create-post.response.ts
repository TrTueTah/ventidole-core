import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostVisibility } from '../request/create-post.request';

export class CreatePostResponse {
  @ApiProperty({
    description: 'Post ID',
    example: 'post-clx123abc',
  })
  postId: string;

  @ApiProperty({
    description: 'User ID who created the post',
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({
    description: 'Username of the author',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Display name of the author',
    example: 'John Doe',
  })
  displayName: string;

  @ApiPropertyOptional({
    description: 'User avatar URL',
    example: 'https://storage.googleapis.com/bucket/avatars/user-123.jpg',
  })
  userAvatar?: string;

  @ApiProperty({
    description: 'Post content',
    example: 'Beautiful sunset at the beach! 🌅 #nature #sunset',
  })
  content: string;

  @ApiPropertyOptional({
    description: 'Media URLs',
    type: [String],
    example: ['https://storage.googleapis.com/bucket/image1.jpg'],
  })
  mediaUrls?: string[];

  @ApiPropertyOptional({
    description: 'Hashtags',
    type: [String],
    example: ['nature', 'sunset'],
  })
  hashtags?: string[];

  @ApiPropertyOptional({
    description: 'Mentioned user IDs',
    type: [String],
    example: ['user-id-1'],
  })
  mentions?: string[];

  @ApiPropertyOptional({
    description: 'Location',
    example: 'Santa Monica Beach, CA',
  })
  location?: string;

  @ApiProperty({
    description: 'Post visibility',
    enum: PostVisibility,
    example: PostVisibility.PUBLIC,
  })
  visibility: PostVisibility;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-05T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Counters',
    example: { likesCount: 0, commentsCount: 0, sharesCount: 0 },
  })
  counters: {
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
  };
}