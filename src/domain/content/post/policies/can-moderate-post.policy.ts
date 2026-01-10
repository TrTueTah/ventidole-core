import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can Moderate Post Policy
 *
 * Authorization policy for moderating posts (delete, etc.).
 *
 * Business rules:
 * - Post author can moderate their own posts
 * - Community owner can moderate posts in their community
 * - Admin users can moderate any post
 * - User must be active
 *
 * Note: Policies are AUTHORIZATION concerns, not pure domain.
 * They CAN use Prisma to check permissions.
 */
@Injectable()
export class CanModeratePostPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can moderate the post
   *
   * @throws ForbiddenException if not authorized
   */
  async check(userId: string, postId: string): Promise<void> {
    // Check user exists and is active
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, isActive: true, isDeleted: true },
    });

    if (!user) {
      throw new ForbiddenException('User not found');
    }

    if (!user.isActive || user.isDeleted) {
      throw new ForbiddenException('User account is inactive');
    }

    // Admin can moderate any post
    if (user.role === 'ADMIN') {
      return;
    }

    // Check post exists
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        authorId: true,
        communityId: true,
      },
    });

    if (!post) {
      throw new ForbiddenException('Post not found');
    }

    // Author can moderate their own post
    if (post.authorId === userId) {
      return;
    }

    // Community owner can moderate posts in their community
    if (post.communityId) {
      const community = await this.prisma.community.findUnique({
        where: { id: post.communityId },
        select: { ownerId: true },
      });

      if (community && community.ownerId === userId) {
        return;
      }
    }

    throw new ForbiddenException('Not authorized to moderate this post');
  }
}
