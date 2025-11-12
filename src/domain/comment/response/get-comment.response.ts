import { ApiProperty } from '@nestjs/swagger';

export class UserInfoDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user-123',
  })
  userId: string;

  @ApiProperty({
    description: 'Username',
    example: 'johndoe',
  })
  username: string;

  @ApiProperty({
    description: 'Display name',
    example: 'John Doe',
  })
  displayName: string;

  @ApiProperty({
    description: 'User avatar URL',
    example: 'https://storage.googleapis.com/bucket/avatars/user-123.jpg',
    required: false,
  })
  avatarUrl?: string;
}

export class CommentDto {
  @ApiProperty({
    description: 'Comment ID',
    example: 'comment-clx456def',
  })
  commentId: string;

  @ApiProperty({
    description: 'Post ID',
    example: 'post-clx123abc',
  })
  postId: string;

  @ApiProperty({
    description: 'Parent comment ID (for replies)',
    example: 'comment-clx789ghi',
    required: false,
  })
  parentCommentId?: string;

  @ApiProperty({
    description: 'Comment content',
    example: 'Great post! I love it 🔥',
  })
  content: string;

  @ApiProperty({
    description: 'User information',
    type: UserInfoDto,
  })
  user: UserInfoDto;

  @ApiProperty({
    description: 'Number of likes',
    example: 5,
  })
  likesCount: number;

  @ApiProperty({
    description: 'Number of replies',
    example: 2,
  })
  repliesCount: number;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2025-11-12T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2025-11-12T10:35:00Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Whether comment is deleted',
    example: false,
  })
  isDeleted: boolean;
}

export class GetCommentResponse {
  @ApiProperty({
    description: 'Comment data',
    type: CommentDto,
  })
  data: CommentDto;
}
