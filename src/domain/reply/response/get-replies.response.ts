import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ReplyDto } from './get-reply.response';

export class GetRepliesResponse extends PaginationResponse<ReplyDto> {
  @ApiProperty({
    description: 'List of replies',
    type: [ReplyDto],
  })
  data: ReplyDto[];
}
