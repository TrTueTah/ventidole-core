import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { CartRepository } from '@domain/commerce/cart/cart.repository';
import { CartAggregate } from '@domain/commerce/cart/cart.aggregate';
import { CartId } from '@domain/shared/value-objects/cart-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';

/**
 * Cart Repository Prisma Implementation
 *
 * Implements CartRepository interface using Prisma ORM.
 *
 * Responsibilities:
 * - Map between domain aggregates and Prisma models
 * - Persist and retrieve carts
 * - Sync cart items
 * - Publish domain events after persistence
 */
@Injectable()
export class CartRepositoryPrisma implements CartRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async save(cart: CartAggregate): Promise<void> {
    const data = this.toPersistence(cart);

    // Upsert cart
    await this.prisma.cart.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        userId: data.userId,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        updatedAt: data.updatedAt,
      },
    });

    // Sync cart items
    await this.syncCartItems(cart);

    // Publish domain events
    const events = cart.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    cart.clearDomainEvents();
  }

  async findById(id: CartId): Promise<CartAggregate | null> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: id.value, isDeleted: false },
      include: {
        items: {
          where: { isDeleted: false },
          select: {
            id: true,
            productId: true,
            variantId: true,
            quantity: true,
            product: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!cart) {
      return null;
    }

    return this.fromPersistence(cart);
  }

  async findByUser(userId: UserId): Promise<CartAggregate | null> {
    const cart = await this.prisma.cart.findFirst({
      where: {
        userId: userId.value,
        isDeleted: false,
        isActive: true,
      },
      include: {
        items: {
          where: { isDeleted: false },
          select: {
            id: true,
            productId: true,
            variantId: true,
            quantity: true,
            product: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!cart) {
      return null;
    }

    return this.fromPersistence(cart);
  }

  async existsByUser(userId: UserId): Promise<boolean> {
    const count = await this.prisma.cart.count({
      where: {
        userId: userId.value,
        isDeleted: false,
        isActive: true,
      },
    });

    return count > 0;
  }

  async delete(id: CartId): Promise<void> {
    await this.prisma.cart.update({
      where: { id: id.value },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  /**
   * Sync cart items between aggregate and database
   */
  private async syncCartItems(cart: CartAggregate): Promise<void> {
    const cartId = cart.id.value;
    const currentItems = cart.getItems();

    // Get existing items from database
    const existingItems = await this.prisma.cartItem.findMany({
      where: { cartId, isDeleted: false },
      select: { id: true },
    });

    const existingItemIds = new Set(existingItems.map((item) => item.id));
    const currentItemIds = new Set(currentItems.map((item) => item.id.value));

    // Delete items that are no longer in the cart
    const itemsToDelete = existingItems.filter(
      (item) => !currentItemIds.has(item.id),
    );

    if (itemsToDelete.length > 0) {
      await this.prisma.cartItem.updateMany({
        where: {
          id: { in: itemsToDelete.map((item) => item.id) },
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      });
    }

    // Upsert current items
    for (const item of currentItems) {
      await this.prisma.cartItem.upsert({
        where: { id: item.id.value },
        create: {
          id: item.id.value,
          cartId,
          productId: item.productId.value,
          variantId: item.variantId,
          quantity: item.quantity.value,
        },
        update: {
          quantity: item.quantity.value,
          isDeleted: false, // Undelete if previously deleted
          deletedAt: null,
        },
      });
    }
  }

  /**
   * Map from Prisma model to domain aggregate
   */
  private fromPersistence(data: any): CartAggregate {
    // Map items with product data
    const items = data.items.map((item: any) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      variantId: item.variantId,
      quantity: item.quantity,
      unitPrice: item.product.price,
    }));

    return CartAggregate.fromPersistence({
      id: data.id,
      userId: data.userId,
      status: 'ACTIVE', // Currently all carts are ACTIVE (no status field in DB yet)
      items,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    });
  }

  /**
   * Map from domain aggregate to Prisma model
   */
  private toPersistence(cart: CartAggregate): any {
    return {
      id: cart.id.value,
      userId: cart.userId.value,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
