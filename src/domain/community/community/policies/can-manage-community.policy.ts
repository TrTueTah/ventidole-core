import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can Manage Community Policy
 *
 * Authorization policy for community management operations.
 *
 * Business rules:
 * - Only admin users can manage communities
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

    // Only admin can manage communities
    if (requester.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can manage communities');
    }

    // Verify community exists and is not deleted
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { isActive: true, isDeleted: true },
    });

    if (!community) {
      throw new ForbiddenException('Community not found');
    }

    if (community.isDeleted) {
      throw new ForbiddenException('Cannot manage deleted community');
    }
  }
}
