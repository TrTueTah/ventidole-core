import { ApiProperty } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { CommentDto } from './get-comment.response';

export class GetCommentsResponse extends PaginationResponse<CommentDto> {
  @ApiProperty({
    description: 'List of comments',
    type: [CommentDto],
  })
  data: CommentDto[];
}
