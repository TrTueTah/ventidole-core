import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can View Order Policy
 *
 * Authorization policy for viewing orders.
 *
 * Business rules:
 * - Customer can view their own orders
 * - Shop owner can view orders from their shop
 * - Admin can view any order
 *
 * Note: Policies are AUTHORIZATION concerns, not pure domain.
 * They CAN use Prisma to check permissions.
 */
@Injectable()
export class CanViewOrderPolicy {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Check if user can view the order
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

    // Admin can view any order
    if (user.role === 'ADMIN') {
      return;
    }

    // Check order exists
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: {
        customerId: true,
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

    // Customer can view their own orders
    if (order.customerId === userId) {
      return;
    }

    // Shop owner can view orders from their shop
    if (order.shop.ownerId === userId) {
      return;
    }

    throw new ForbiddenException('Not authorized to view this order');
  }
}
