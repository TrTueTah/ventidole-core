import { ApiProperty } from '@nestjs/swagger';
import { PageInfo } from '@shared/dto/pagination-response.dto';
import { PostDto } from './get-post.response';

export class GetPostsResponse {
  @ApiProperty({
    description: 'Array of posts',
    type: [PostDto],
  })
  data: PostDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PageInfo,
  })
  paging: PageInfo;
}
