import { ApiProperty } from '@nestjs/swagger';

/**
 * Community Response DTO
 *
 * Response DTO for community data.
 */
export class CommunityResponseDto {
  @ApiProperty({ example: 'comm_abc123' })
  id: string;

  @ApiProperty({ example: 'K-Pop Lovers' })
  name: string;

  @ApiProperty({ example: 'GROUP', enum: ['SOLO', 'GROUP'] })
  type: string;

  @ApiProperty({ example: 'user_xyz789' })
  ownerId: string;

  @ApiProperty({ example: 'A community for K-Pop enthusiasts', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: 'https://example.com/background.jpg', nullable: true })
  backgroundUrl: string | null;

  @ApiProperty({ example: 1250 })
  followerCount: number;

  @ApiProperty({ example: 430 })
  postCount: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T08:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T14:45:00Z' })
  updatedAt: Date;
}
