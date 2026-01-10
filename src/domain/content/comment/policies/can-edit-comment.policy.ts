import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can Edit Comment Policy
 *
 * Authorization policy for editing comments.
 *
 * Business rules:
 * - Only comment author can edit their comments
 * - Cannot edit deleted comments
 * - User must be active
 *
 * Note: Policies are AUTHORIZATION concerns, not pure domain.
 * They CAN use Prisma to check permissions.
 */
@Injectable()
export class CanEditCommentPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can edit the comment
   *
   * @throws ForbiddenException if not authorized
   */
  async check(userId: string, commentId: string): Promise<void> {
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

    // Check comment exists and user is author
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: { authorId: true, isDeleted: true },
    });

    if (!comment) {
      throw new ForbiddenException('Comment not found');
    }

    if (comment.isDeleted) {
      throw new ForbiddenException('Cannot edit deleted comment');
    }

    if (comment.authorId !== userId) {
      throw new ForbiddenException('Only comment author can edit the comment');
    }
  }
}
