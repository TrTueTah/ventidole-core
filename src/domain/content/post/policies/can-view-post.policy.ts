import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can View Post Policy
 *
 * Authorization policy for viewing posts.
 *
 * Business rules:
 * - Public posts: Anyone can view
 * - Community posts: Only community followers can view
 * - Deleted posts: Cannot be viewed (except by author/admin)
 *
 * Note: Policies are AUTHORIZATION concerns, not pure domain.
 * They CAN use Prisma to check permissions.
 */
@Injectable()
export class CanViewPostPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can view the post
   *
   * @throws ForbiddenException if not authorized
   */
  async check(userId: string | null, postId: string): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        communityId: true,
        isDeleted: true,
      },
    });

    if (!post) {
      throw new ForbiddenException('Post not found');
    }

    // Deleted posts: Only author and admin can view
    if (post.isDeleted) {
      if (!userId) {
        throw new ForbiddenException('Post has been deleted');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (post.authorId !== userId && user?.role !== 'ADMIN') {
        throw new ForbiddenException('Post has been deleted');
      }

      return;
    }

    // Public posts (no community): Anyone can view
    if (!post.communityId) {
      return;
    }

    // Community posts: Check if user is follower
    if (!userId) {
      throw new ForbiddenException('Must be logged in to view community posts');
    }

    const isFollower = await this.prisma.communityFollower.findUnique({
      where: {
        communityId_userId: {
          communityId: post.communityId,
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
        throw new ForbiddenException('Must be community follower to view this post');
      }
    }
  }
}
