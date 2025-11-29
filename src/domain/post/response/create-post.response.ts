import { ApiProperty } from '@nestjs/swagger';

export class CreatePostResponse {
  @ApiProperty({
    description: 'Post ID',
    example: 'post-clx123abc',
    type: String,
  })
  postId: string;

  @ApiProperty({
    description: 'Community ID',
    example: 'community-123',
    type: String,
  })
  communityId: string;

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