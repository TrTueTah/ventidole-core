import { ApiProperty } from '@nestjs/swagger';

export class DeleteReplyResponse {
  @ApiProperty({
    description: 'Success message',
    example: 'Reply deleted successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Deleted reply ID',
    example: 'reply-clx789ghi',
  })
  replyId: string;
}
