import { ApiProperty } from '@nestjs/swagger';

/**
 * Comment Response DTO
 *
 * Response DTO for comment data.
 */
export class CommentResponseDto {
  @ApiProperty({ example: 'comment_abc123' })
  id: string;

  @ApiProperty({ example: 'post_xyz789' })
  postId: string;

  @ApiProperty({ example: 'user_def456' })
  authorId: string;

  @ApiProperty({ example: 'comment_parent123', nullable: true })
  parentCommentId: string | null;

  @ApiProperty({ example: 'This is a great post!' })
  content: string;

  @ApiProperty({ example: 5 })
  replyCount: number;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: '2024-01-15T08:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T14:45:00Z' })
  updatedAt: Date;
}
