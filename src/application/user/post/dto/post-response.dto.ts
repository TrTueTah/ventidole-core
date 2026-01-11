import { ApiProperty } from '@nestjs/swagger';

/**
 * Post Media Response DTO
 */
export class PostMediaResponseDto {
  @ApiProperty({ example: 'https://example.com/media/image1.jpg' })
  url: string;

  @ApiProperty({ example: 0 })
  order: number;
}

/**
 * Post Response DTO
 *
 * Response DTO for post data.
 */
export class PostResponseDto {
  @ApiProperty({ example: 'post_abc123' })
  id: string;

  @ApiProperty({ example: 'user_xyz789' })
  authorId: string;

  @ApiProperty({ example: 'comm_def456', nullable: true })
  communityId: string | null;

  @ApiProperty({ example: 'This is an amazing post about K-Pop!' })
  content: string;

  @ApiProperty({ type: [PostMediaResponseDto] })
  media: PostMediaResponseDto[];

  @ApiProperty({ example: 245 })
  likeCount: number;

  @ApiProperty({ example: 1520 })
  viewCount: number;

  @ApiProperty({ example: 34 })
  commentCount: number;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: '2024-01-15T08:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T14:45:00Z' })
  updatedAt: Date;
}
