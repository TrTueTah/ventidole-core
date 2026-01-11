import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Can Manage Shop Policy
 *
 * Authorization policy for managing shops (update, activate, deactivate).
 *
 * Rules:
 * - Shop owners can manage their own shops
 * - Admins can manage all shops
 */
@Injectable()
export class CanManageShopPolicy {
  constructor(private readonly prisma: PrismaService) {}

  async check(userId: string, shopId: string): Promise<void> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        ownerId: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Shop owners can manage their own shops
    if (shop.ownerId === userId) {
      return;
    }

    // Check if user is admin
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    });

    if (user?.role === 'ADMIN') {
      return;
    }

    // Neither owner nor admin
    throw new ForbiddenException('You do not have permission to manage this shop');
  }
}
