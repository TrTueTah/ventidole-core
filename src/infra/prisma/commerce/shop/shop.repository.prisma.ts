import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { ShopRepository } from '@domain/commerce/shop/shop.repository';
import { ShopAggregate } from '@domain/commerce/shop/shop.aggregate';
import { ShopId } from '@domain/shared/value-objects/shop-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';

/**
 * Shop Repository Prisma Implementation
 *
 * Implements ShopRepository interface using Prisma ORM.
 *
 * Responsibilities:
 * - Map between domain aggregates and Prisma models
 * - Persist and retrieve shops
 * - Publish domain events after persistence
 */
@Injectable()
export class ShopRepositoryPrisma implements ShopRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async save(shop: ShopAggregate): Promise<void> {
    const data = this.toPersistence(shop);

    // Upsert shop
    await this.prisma.shop.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        ownerId: data.ownerId,
        name: data.name,
        description: data.description,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        isActive: data.isActive,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        name: data.name,
        description: data.description,
        logoUrl: data.logoUrl,
        bannerUrl: data.bannerUrl,
        isActive: data.isActive,
        updatedAt: data.updatedAt,
      },
    });

    // Publish domain events
    const events = shop.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    shop.clearDomainEvents();
  }

  async findById(id: ShopId): Promise<ShopAggregate | null> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: id.value },
    });

    if (!shop) {
      return null;
    }

    return this.fromPersistence(shop);
  }

  async findByOwner(ownerId: UserId): Promise<ShopAggregate | null> {
    const shop = await this.prisma.shop.findUnique({
      where: { ownerId: ownerId.value },
    });

    if (!shop) {
      return null;
    }

    return this.fromPersistence(shop);
  }

  async findAll(params: {
    page: number;
    limit: number;
    isActive?: boolean;
  }): Promise<{ shops: ShopAggregate[]; total: number }> {
    const where: any = {};

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where,
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.shop.count({ where }),
    ]);

    return {
      shops: shops.map((s) => this.fromPersistence(s)),
      total,
    };
  }

  async existsByOwner(ownerId: UserId): Promise<boolean> {
    const count = await this.prisma.shop.count({
      where: { ownerId: ownerId.value },
    });

    return count > 0;
  }

  /**
   * Map from Prisma model to domain aggregate
   */
  private fromPersistence(data: any): ShopAggregate {
    return ShopAggregate.fromPersistence({
      id: data.id,
      ownerId: data.ownerId,
      name: data.name,
      description: data.description,
      logoUrl: data.logoUrl,
      bannerUrl: data.bannerUrl,
      isActive: data.isActive,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Map from domain aggregate to Prisma model
   */
  private toPersistence(shop: ShopAggregate): any {
    return {
      id: shop.id.value,
      ownerId: shop.ownerId.value,
      name: shop.name.value,
      description: shop.description,
      logoUrl: shop.logoUrl,
      bannerUrl: shop.bannerUrl,
      isActive: shop.isActive,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  }
}
