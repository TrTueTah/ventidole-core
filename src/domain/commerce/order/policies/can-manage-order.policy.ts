import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can Manage Order Policy
 *
 * Authorization policy for managing orders (confirm, ship, etc.).
 *
 * Business rules:
 * - Shop owner can manage orders from their shop
 * - Admin can manage any order
 * - Customers cannot manage orders (only cancel their own)
 *
 * Note: Policies are AUTHORIZATION concerns, not pure domain.
 * They CAN use Prisma to check permissions.
 */
@Injectable()
export class CanManageOrderPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can manage the order
   *
   * @throws ForbiddenException if not authorized
   */
  async check(userId: string, orderId: string): Promise<void> {
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

    // Admin can manage any order
    if (user.role === 'ADMIN') {
      return;
    }

    // Check order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        shop: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!order) {
      throw new ForbiddenException('Order not found');
    }

    // Shop owner can manage orders from their shop
    if (order.shop.ownerId === userId) {
      return;
    }

    throw new ForbiddenException('Not authorized to manage this order');
  }
}
