import { ApiProperty } from '@nestjs/swagger';
import { ReplyDto } from './get-reply.response';

export class CreateReplyResponse extends ReplyDto {
  @ApiProperty({
    description: 'Success message',
    example: 'Reply created successfully',
  })
  message?: string;
}
