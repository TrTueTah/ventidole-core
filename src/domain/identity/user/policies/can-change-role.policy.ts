import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * CanChangeRole Policy
 *
 * Authorization rule: Who can change a user's role?
 *
 * Rules:
 * - Only admins can change roles
 * - Admins cannot change their own role (prevents lock-out)
 * - Cannot change role of deleted users
 *
 * Note: Policies can access infrastructure (Prisma) as they're
 * authorization concerns, not pure domain logic.
 */
@Injectable()
export class CanChangeRolePolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if requester can change target user's role
   *
   * @param requesterId - ID of the user making the request
   * @param targetUserId - ID of the user whose role is being changed
   * @throws ForbiddenException if not allowed
   */
  async check(requesterId: string, targetUserId: string): Promise<void> {
    // Cannot change your own role
    if (requesterId === targetUserId) {
      throw new ForbiddenException('Cannot change your own role');
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
      throw new ForbiddenException('Only admins can change user roles');
    }

    // Check target user exists and is not deleted
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { isDeleted: true },
    });

    if (!targetUser) {
      throw new ForbiddenException('Target user not found');
    }

    if (targetUser.isDeleted) {
      throw new ForbiddenException('Cannot change role of deleted user');
    }

    // Admin is allowed
  }
}
