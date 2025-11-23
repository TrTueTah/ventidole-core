import { ApiProperty } from '@nestjs/swagger';
import { ChatMessageResponse } from './chat.response';

export class PaginatedMessagesResponse {
  @ApiProperty({ type: [ChatMessageResponse] })
  data: ChatMessageResponse[];

  @ApiProperty({
    description: 'Pagination metadata',
  })
  pagination: {
    hasMore: boolean;
    limit: number;
    lastMessageId?: string;
    total?: number;
  };
}
