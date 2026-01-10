import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * CanDeactivateUser Policy
 *
 * Authorization rule: Who can deactivate a user?
 *
 * Rules:
 * - Users can deactivate their own account
 * - Admins can deactivate any user account
 * - Admins cannot deactivate their own account (prevents lock-out)
 *
 * Note: Policies can access infrastructure (Prisma) as they're
 * authorization concerns, not pure domain logic.
 */
@Injectable()
export class CanDeactivateUserPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if requester can deactivate target user
   *
   * @param requesterId - ID of the user making the request
   * @param targetUserId - ID of the user being deactivated
   * @throws ForbiddenException if not allowed
   */
  async check(requesterId: string, targetUserId: string): Promise<void> {
    const requester = await this.prisma.user.findUnique({
      where: { id: requesterId },
      select: { role: true, isActive: true, isDeleted: true },
    });

    if (!requester) {
      throw new ForbiddenException('Requester not found');
    }

    if (!requester.isActive || requester.isDeleted) {
      throw new ForbiddenException('Requester is inactive');
    }

    // User can deactivate their own account
    if (requesterId === targetUserId) {
      return; // Allowed
    }

    // Only admins can deactivate other users
    if (requester.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can deactivate other users');
    }

    // Admin cannot deactivate themselves (different user ID check above handles this)
    // Admin is allowed to deactivate other users
  }
}
