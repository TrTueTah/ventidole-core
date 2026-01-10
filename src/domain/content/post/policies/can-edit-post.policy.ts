import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can Edit Post Policy
 *
 * Authorization policy for editing posts.
 *
 * Business rules:
 * - Only post author can edit their posts
 * - Cannot edit deleted posts
 * - User must be active
 *
 * Note: Policies are AUTHORIZATION concerns, not pure domain.
 * They CAN use Prisma to check permissions.
 */
@Injectable()
export class CanEditPostPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can edit the post
   *
   * @throws ForbiddenException if not authorized
   */
  async check(userId: string, postId: string): Promise<void> {
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

    // Check post exists and user is author
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { authorId: true, isDeleted: true },
    });

    if (!post) {
      throw new ForbiddenException('Post not found');
    }

    if (post.isDeleted) {
      throw new ForbiddenException('Cannot edit deleted post');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException('Only post author can edit the post');
    }
  }
}
