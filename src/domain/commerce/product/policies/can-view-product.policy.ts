import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can View Product Policy
 *
 * Authorization policy for viewing products.
 *
 * Rules:
 * - Anyone can view active products
 * - Shop owners can view their own inactive products
 * - Admins can view all products
 */
@Injectable()
export class CanViewProductPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async check(userId: string, productId: string): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        isActive: true,
        isDeleted: true,
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

    // Cannot view deleted products
    if (product.isDeleted) {
      throw new Error('Product not found');
    }

    // Anyone can view active products
    if (product.isActive) {
      return;
    }

    // Get user
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Admins can view all products
    if (user.role === 'ADMIN') {
      return;
    }

    // Shop owners can view their own inactive products
    if (product.shop.ownerId === userId) {
      return;
    }

    throw new Error('Forbidden: Cannot view this product');
  }
}
