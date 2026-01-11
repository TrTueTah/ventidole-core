import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can Manage Cart Policy
 *
 * Enforces authorization rules for cart management.
 *
 * Rules:
 * - Users can only manage their own cart
 * - Admin can manage any cart (for support purposes)
 */
@Injectable()
export class CanManageCartPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can manage the specified cart
   */
  async check(userId: string, cartId: string): Promise<void> {
    // Find cart
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      select: { userId: true },
    });

    if (!cart) {
      throw new ForbiddenException('Cart not found');
    }

    // Check ownership
    if (cart.userId !== userId) {
      // Check if user is admin
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      });

      if (user?.role !== 'ADMIN') {
        throw new ForbiddenException('You can only manage your own cart');
      }
    }
  }
}
