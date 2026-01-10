import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can Manage Product Policy
 *
 * Authorization policy for managing products (update, delete, stock management).
 *
 * Rules:
 * - Shop owners can manage their own products
 * - Admins can manage all products
 */
@Injectable()
export class CanManageProductPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async check(userId: string, productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        shop: {
          select: {
            ownerId: true,
          },
        },
      },
    });

    if (!product) {
      throw new Error('Product not found');
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Admins can manage all products
    if (user.role === 'ADMIN') {
      return;
    }

    // Shop owners can manage their own products
    if (product.shop.ownerId === userId) {
      return;
    }

    throw new Error('Forbidden: Cannot manage this product');
  }
}
