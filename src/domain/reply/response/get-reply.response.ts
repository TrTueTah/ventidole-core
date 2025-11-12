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

export class ReplyDto {
  @ApiProperty({
    description: 'Reply ID',
    example: 'reply-clx789ghi',
  })
  replyId: string;

  @ApiProperty({
    description: 'Comment ID',
    example: 'comment-clx456def',
  })
  commentId: string;

  @ApiProperty({
    description: 'Reply content',
    example: 'Thank you! 😊',
  })
  content: string;

  @ApiProperty({
    description: 'User information',
    type: UserInfoDto,
  })
  user: UserInfoDto;

  @ApiProperty({
    description: 'Number of likes',
    example: 3,
  })
  likesCount: number;

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
    description: 'Whether reply is deleted',
    example: false,
  })
  isDeleted: boolean;
}

export class GetReplyResponse {
  @ApiProperty({
    description: 'Reply data',
    type: ReplyDto,
  })
  data: ReplyDto;
}
