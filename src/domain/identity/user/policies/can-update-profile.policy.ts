import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * CanUpdateProfile Policy
 *
 * Authorization rule: Who can update a user's profile?
 *
 * Rules:
 * - Users can always update their own profile (if active)
 * - Admins can update any user's profile
 *
 * Note: Policies can access infrastructure (Prisma) as they're
 * authorization concerns, not pure domain logic.
 */
@Injectable()
export class CanUpdateProfilePolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if requester can update target user's profile
   *
   * @param requesterId - ID of the user making the request
   * @param targetUserId - ID of the user being updated
   * @throws ForbiddenException if not allowed
   */
  async check(requesterId: string, targetUserId: string): Promise<void> {
    // User can always update their own profile
    if (requesterId === targetUserId) {
      const user = await this.prisma.user.findUnique({
        where: { id: requesterId },
        select: { isActive: true, isDeleted: true },
      });

      if (!user) {
        throw new ForbiddenException('User not found');
      }

      if (!user.isActive || user.isDeleted) {
        throw new ForbiddenException('Cannot update profile of inactive user');
      }

      return; // Allowed
    }

    // Check if requester is admin
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

    if (requester.role !== 'ADMIN') {
      throw new ForbiddenException('Only admins can update other users\' profiles');
    }

    // Admin is allowed
  }
}
