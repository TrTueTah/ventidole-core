import { ApiProperty } from '@nestjs/swagger';
import { CommentDto } from './get-comment.response';

export class UpdateCommentResponse extends CommentDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Comment updated successfully',
  })
  message?: string;
}
