/**
 * Comment Response DTO
 *
 * Response DTO for comment data.
 */
export class CommentResponseDto {
  id: string;
  postId: string;
  authorId: string;
  parentCommentId: string | null;
  content: string;
  replyCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
