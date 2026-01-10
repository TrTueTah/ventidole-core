import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { ProductRepository } from '@domain/commerce/product/product.repository';
import { ProductAggregate } from '@domain/commerce/product/product.aggregate';
import { ProductId } from '@domain/shared/value-objects/product-id.vo';
import { ShopId } from '@domain/shared/value-objects/shop-id.vo';

/**
 * Product Repository Prisma Implementation
 *
 * Implements ProductRepository interface using Prisma ORM.
 *
 * Responsibilities:
 * - Map between domain aggregates and Prisma models
 * - Persist and retrieve products
 * - Sync product variants
 * - Publish domain events after persistence
 */
@Injectable()
export class ProductRepositoryPrisma implements ProductRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async save(product: ProductAggregate): Promise<void> {
    const data = this.toPersistence(product);

    // Upsert product
    await this.prisma.product.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        shopId: data.shopId,
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        imageUrls: data.imageUrls,
        category: data.category,
        isActive: data.isActive,
        isDeleted: data.isDeleted,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        name: data.name,
        description: data.description,
        basePrice: data.basePrice,
        imageUrls: data.imageUrls,
        category: data.category,
        isActive: data.isActive,
        isDeleted: data.isDeleted,
        updatedAt: data.updatedAt,
      },
    });

    // Sync product variants
    await this.syncProductVariants(product);

    // Publish domain events
    const events = product.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    product.clearDomainEvents();
  }

  async findById(id: ProductId): Promise<ProductAggregate | null> {
    const product = await this.prisma.product.findUnique({
      where: { id: id.value },
      include: {
        variants: {
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!product) {
      return null;
    }

    return this.fromPersistence(product);
  }

  async findByShop(
    shopId: ShopId,
    params: { page: number; limit: number; category?: string; isActive?: boolean },
  ): Promise<{ products: ProductAggregate[]; total: number }> {
    const where: any = {
      shopId: shopId.value,
      isDeleted: false,
    };

    if (params.category) {
      where.category = params.category;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          variants: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => this.fromPersistence(p)),
      total,
    };
  }

  async findAll(params: {
    page: number;
    limit: number;
    category?: string;
    shopId?: string;
    isActive?: boolean;
  }): Promise<{ products: ProductAggregate[]; total: number }> {
    const where: any = {
      isDeleted: false,
    };

    if (params.category) {
      where.category = params.category;
    }

    if (params.shopId) {
      where.shopId = params.shopId;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          variants: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => this.fromPersistence(p)),
      total,
    };
  }

  async searchByName(
    query: string,
    params: {
      page: number;
      limit: number;
      category?: string;
      isActive?: boolean;
    },
  ): Promise<{ products: ProductAggregate[]; total: number }> {
    const where: any = {
      isDeleted: false,
      name: {
        contains: query,
        mode: 'insensitive',
      },
    };

    if (params.category) {
      where.category = params.category;
    }

    if (params.isActive !== undefined) {
      where.isActive = params.isActive;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        include: {
          variants: {
            select: {
              id: true,
              name: true,
              price: true,
              stock: true,
              isActive: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products: products.map((p) => this.fromPersistence(p)),
      total,
    };
  }

  /**
   * Sync product variants between aggregate and database
   */
  private async syncProductVariants(product: ProductAggregate): Promise<void> {
    const productId = product.id.value;
    const currentVariants = product.getVariants();

    // Get existing variants from database
    const existingVariants = await this.prisma.productVariant.findMany({
      where: { productId },
      select: { id: true },
    });

    const existingVariantIds = new Set(existingVariants.map((v) => v.id));
    const currentVariantIds = new Set(currentVariants.map((v) => v.id));

    // Delete removed variants
    const variantsToDelete = Array.from(existingVariantIds).filter(
      (id) => !currentVariantIds.has(id),
    );

    if (variantsToDelete.length > 0) {
      await this.prisma.productVariant.deleteMany({
        where: {
          id: { in: variantsToDelete },
        },
      });
    }

    // Upsert current variants
    for (const variant of currentVariants) {
      await this.prisma.productVariant.upsert({
        where: { id: variant.id },
        create: {
          id: variant.id,
          productId,
          name: variant.name,
          price: variant.price.amount,
          stock: variant.stock.quantity,
          isActive: variant.isActive,
          createdAt: variant.createdAt,
          updatedAt: variant.updatedAt,
        },
        update: {
          name: variant.name,
          price: variant.price.amount,
          stock: variant.stock.quantity,
          isActive: variant.isActive,
          updatedAt: variant.updatedAt,
        },
      });
    }
  }

  /**
   * Map from Prisma model to domain aggregate
   */
  private fromPersistence(data: any): ProductAggregate {
    return ProductAggregate.fromPersistence({
      id: data.id,
      shopId: data.shopId,
      name: data.name,
      description: data.description,
      basePrice: data.basePrice,
      imageUrls: data.imageUrls || [],
      category: data.category,
      isActive: data.isActive,
      isDeleted: data.isDeleted,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      variants: data.variants || [],
    });
  }

  /**
   * Map from domain aggregate to Prisma model
   */
  private toPersistence(product: ProductAggregate): any {
    return {
      id: product.id.value,
      shopId: product.shopId.value,
      name: product.name.value,
      description: product.description,
      basePrice: product.basePrice.amount,
      imageUrls: product.imageUrls,
      category: product.category,
      isActive: product.isActive,
      isDeleted: product.isDeleted,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
