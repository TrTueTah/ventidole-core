import { ApiProperty } from '@nestjs/swagger';
import { PostVisibility } from '../request/create-post.request';

export class CreatePostResponse {
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
    description: 'Username of the author',
    example: 'johndoe',
    type: String,
  })
  username: string;

  @ApiProperty({
    description: 'Display name of the author',
    example: 'John Doe',
    type: String,
  })
  displayName: string;

  @ApiProperty({
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
  mediaUrls?: string[];

  @ApiProperty({
    description: 'Hashtags',
    type: [String],
    example: ['nature', 'sunset'],
  })
  hashtags?: string[];

  @ApiProperty({
    description: 'Mentioned user IDs',
    type: [String],
    example: ['user-id-1'],
  })
  mentions?: string[];

  @ApiProperty({
    description: 'Location',
    example: 'Santa Monica Beach, CA',
    type: String,
  })
  location?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-05T10:30:00Z',
    type: String,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Counters',
    example: { likesCount: 0, commentsCount: 0, sharesCount: 0 },
    type: Object,
  })
  counters: {
    likesCount: number;
    commentsCount: number;
    sharesCount: number;
  };
}