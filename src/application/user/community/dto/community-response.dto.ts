/**
 * Community Response DTO
 *
 * Response DTO for community data.
 */
export class CommunityResponseDto {
  id: string;
  name: string;
  type: string;
  ownerId: string;
  description: string | null;
  avatarUrl: string | null;
  backgroundUrl: string | null;
  followerCount: number;
  postCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
