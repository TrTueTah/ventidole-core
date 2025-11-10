import { ApiProperty } from '@nestjs/swagger';

export class DeletePostResponse {
  @ApiProperty({
    description: 'Post ID',
    example: 'post-clx123abc',
    type: String,
  })
  postId: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Post deleted successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Deletion timestamp',
    example: '2025-11-05T10:30:00Z',
    type: String,
  })
  deletedAt: Date;
}
