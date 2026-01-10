/**
 * User Response DTO
 *
 * Data Transfer Object for user profile responses.
 */
export class UserResponseDto {
  id: string;
  email: string;
  username: string;
  role: string;
  profile: {
    avatarUrl: string | null;
    backgroundUrl: string | null;
    bio: string | null;
    isOnline: boolean;
    lastOnlineAt: Date | null;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
