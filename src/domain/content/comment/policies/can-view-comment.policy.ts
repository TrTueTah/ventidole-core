import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can View Comment Policy
 *
 * Authorization policy for viewing comments.
 *
 * Business rules:
 * - If user can view the post, they can view its comments
 * - Deleted comments: Cannot be viewed (except by author/admin)
 *
 * Note: Policies are AUTHORIZATION concerns, not pure domain.
 * They CAN use Prisma to check permissions.
 */
@Injectable()
export class CanViewCommentPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can view the comment
   *
   * @throws ForbiddenException if not authorized
   */
  async check(userId: string | null, commentId: string): Promise<void> {
    const comment = await this.prisma.comment.findUnique({
      where: { id: commentId },
      select: {
        authorId: true,
        isDeleted: true,
        post: {
          select: {
            communityId: true,
            isDeleted: true,
          },
        },
      },
    });

    if (!comment) {
      throw new ForbiddenException('Comment not found');
    }

    // Deleted comments: Only author and admin can view
    if (comment.isDeleted) {
      if (!userId) {
        throw new ForbiddenException('Comment has been deleted');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (comment.authorId !== userId && user?.role !== 'ADMIN') {
        throw new ForbiddenException('Comment has been deleted');
      }

      return;
    }

    // Deleted posts: Comments cannot be viewed
    if (comment.post.isDeleted) {
      throw new ForbiddenException('Post has been deleted');
    }

    // Public posts (no community): Anyone can view comments
    if (!comment.post.communityId) {
      return;
    }

    // Community posts: Check if user is follower
    if (!userId) {
      throw new ForbiddenException(
        'Must be logged in to view community post comments',
      );
    }

    const isFollower = await this.prisma.communityFollower.findUnique({
      where: {
        communityId_userId: {
          communityId: comment.post.communityId,
          userId,
        },
      },
    });

    if (!isFollower) {
      // Check if user is admin
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        throw new ForbiddenException(
          'Must be community follower to view this comment',
        );
      }
    }
  }
}
