import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can Access Premium Content Policy
 *
 * Authorization policy for accessing premium/paid community content.
 *
 * Business rules:
 * - Community owner: Always has access
 * - Admin: Always has access
 * - Subscribed users: Has access if subscription is ACTIVE
 * - Free users: No access
 *
 * Note: Policies are AUTHORIZATION concerns, not pure domain.
 * They CAN use Prisma to check permissions.
 */
@Injectable()
export class CanAccessPremiumContentPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can access premium content in community
   *
   * @param userId - User attempting to access content
   * @param communityId - Community containing the premium content
   * @throws ForbiddenException if not authorized
   */
  async check(userId: string, communityId: string): Promise<void> {
    // Check if community exists
    const community = await this.prisma.community.findUnique({
      where: { id: communityId },
      select: { ownerId: true },
    });

    if (!community) {
      throw new ForbiddenException('Community not found');
    }

    // Rule 1: Community owner always has access
    if (community.ownerId === userId) {
      return;
    }

    // Rule 2: Admin always has access
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      return;
    }

    // Rule 3: Check for active subscription
    const subscription = await this.prisma.subscription.findFirst({
      where: {
        userId,
        communityId,
        status: 'ACTIVE',
      },
    });

    if (!subscription) {
      throw new ForbiddenException(
        'Premium subscription required to access this content',
      );
    }

    // User has active subscription - grant access
  }

  /**
   * Check if user can access premium content (returns boolean instead of throwing)
   * Useful for conditional rendering in UI
   */
  async canAccess(userId: string, communityId: string): Promise<boolean> {
    try {
      await this.check(userId, communityId);
      return true;
    } catch {
      return false;
    }
  }
}
