import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can Manage Community Policy
 *
 * Authorization policy for community management operations.
 *
 * Business rules:
 * - Community owner can always manage their community
 * - Admin users can manage any community
 * - User must be active
 *
 * Note: Policies are AUTHORIZATION concerns, not pure domain.
 * They CAN use Prisma to check permissions.
 */
@Injectable()
export class CanManageCommunityPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if requester can manage the target community
   *
   * @throws ForbiddenException if not authorized
   */
  async check(requesterId: string, communityId: string): Promise<void> {
    // Check requester exists and is active
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true, isActive: true, isDeleted: true },
    });

    if (!requester) {
      throw new ForbiddenException('User not found');
    }

    if (!requester.isActive || requester.isDeleted) {
      throw new ForbiddenException('User account is inactive');
    }

    // Admin can manage any community
    if (requester.role === 'ADMIN') {
      return;
    }

    // Check if requester is the community owner
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { ownerId: true, isActive: true, isDeleted: true },
    });

    if (!community) {
      throw new ForbiddenException('Community not found');
    }

    if (community.isDeleted) {
      throw new ForbiddenException('Cannot manage deleted community');
    }

    if (community.ownerId !== requesterId) {
      throw new ForbiddenException(
        'Only community owner can manage this community',
      );
    }
  }
}
