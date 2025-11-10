import { ApiProperty } from '@nestjs/swagger';

export class UpdatePostResponse {
  @ApiProperty({
    description: 'Post ID',
    example: 'post-clx123abc',
    type: String,
  })
  postId: string;

  @ApiProperty({
    description: 'Success message',
    example: 'Post updated successfully',
    type: String,
  })
  message: string;

  @ApiProperty({
    description: 'Update timestamp',
    example: '2025-11-05T10:30:00Z',
    type: String,
  })
  updatedAt: Date;
}
