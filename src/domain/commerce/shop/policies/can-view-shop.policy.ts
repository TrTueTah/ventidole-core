import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can View Shop Policy
 *
 * Authorization policy for viewing shops.
 *
 * Rules:
 * - Anyone can view active shops
 * - Shop owners can view their own inactive shops
 * - Admins can view all shops
 */
@Injectable()
export class CanViewShopPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async check(userId: string, shopId: string): Promise<void> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        ownerId: true,
        isActive: true,
      },
    });

    if (!shop) {
      throw new Error('Shop not found');
    }

    // Anyone can view active shops
    if (shop.isActive) {
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

    // Admins can view all shops
    if (user.role === 'ADMIN') {
      return;
    }

    // Shop owners can view their own inactive shops
    if (shop.ownerId === userId) {
      return;
    }

    throw new Error('Forbidden: Cannot view this shop');
  }
}
