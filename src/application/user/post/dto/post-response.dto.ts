/**
 * Post Media Response DTO
 */
export class PostMediaResponseDto {
  url: string;
  order: number;
}

/**
 * Post Response DTO
 *
 * Response DTO for post data.
 */
export class PostResponseDto {
  id: string;
  authorId: string;
  communityId: string | null;
  content: string;
  media: PostMediaResponseDto[];
  likeCount: number;
  viewCount: number;
  commentCount: number;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
