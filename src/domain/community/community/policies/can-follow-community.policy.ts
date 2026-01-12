import { PrismaService } from '@infra/prisma/prisma.service';
import { ForbiddenException, Injectable } from '@nestjs/common';

/**
 * Can Follow Community Policy
 *
 * Authorization policy for following communities.
 *
 * Business rules:
 * - User must be active
 * - Community must be active
 * - Anyone can follow any community (SOLO or GROUP)
 * - Cannot follow if already following
 *
 * Note: Policies are AUTHORIZATION concerns, not pure domain.
 * They CAN use Prisma to check permissions.
 */
@Injectable()
export class CanFollowCommunityPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can follow the community
   *
   * @throws ForbiddenException if not authorized
   */
  async check(userId: string, communityId: string): Promise<void> {
    // Check user exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { isActive: true, isDeleted: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.isActive || user.isDeleted) {
      throw new ForbiddenException('User account is inactive');
    }

    // Check community exists and is active
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: {
        isActive: true,
        isDeleted: true,
      },
    });

    if (!community) {
      throw new ForbiddenException('Community not found');
    }

    if (!community.isActive || community.isDeleted) {
      throw new ForbiddenException(
        'Cannot follow inactive or deleted community',
      );
    }

    // Check if already following
    const existingFollow = await this.prisma.communityFollower.findUnique({
      where: {
        userId_communityId: {
          userId,
          communityId,
        },
      },
    });

    if (existingFollow) {
      throw new ForbiddenException('Already following this community');
    }
  }
}
