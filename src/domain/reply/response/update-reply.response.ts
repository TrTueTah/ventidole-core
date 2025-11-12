import { ApiProperty } from '@nestjs/swagger';
import { ReplyDto } from './get-reply.response';

export class UpdateReplyResponse extends ReplyDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Reply updated successfully',
  })
  message?: string;
}
