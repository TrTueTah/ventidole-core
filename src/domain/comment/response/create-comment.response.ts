import { ApiProperty } from '@nestjs/swagger';
import { CommentDto } from './get-comment.response';

export class CreateCommentResponse extends CommentDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Comment created successfully',
  })
  message?: string;
}
