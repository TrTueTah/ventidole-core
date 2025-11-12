import { ApiProperty } from '@nestjs/swagger';

export class DeleteCommentResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Comment deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Deleted comment ID',
    example: 'comment-clx456def',
  })
  commentId: string;
}
