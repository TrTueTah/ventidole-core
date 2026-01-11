import { Module, OnModuleInit } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductApplicationService } from './product.service';
import { ProductRepositoryPrisma } from '@infra/prisma/commerce/product/product.repository.prisma';
import { CanViewProductPolicy } from '@domain/commerce/product/policies/can-view-product.policy';
import { CanManageProductPolicy } from '@domain/commerce/product/policies/can-manage-product.policy';
import { CanManageShopPolicy } from '@domain/commerce/shop/policies/can-manage-shop.policy';
import { EventBus } from '@core/event/event-bus.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { ProductCreatedNotificationHandler } from './event-handlers/product-created-notification.handler';
import { KnockService } from '@infra/knock/knock.service';

/**
 * Product Module
 *
 * Wires together:
 * - Product controller (HTTP layer)
 * - Product application service (use case orchestration)
 * - Product repository (Prisma implementation)
 * - Product policies (authorization)
 * - Product event handlers (side effects)
 */
@Module({
  controllers: [ProductController],
  providers: [
    // Application Service
    ProductApplicationService,

    // Repository (bind interface to implementation)
    {
      provide: 'ProductRepository',
      useClass: ProductRepositoryPrisma,
    },

    // Policies
    CanViewProductPolicy,
    CanManageProductPolicy,
    CanManageShopPolicy,

    // Infrastructure
    EventBus,
    PrismaService,
    KnockService,

    // Event Handlers
    ProductCreatedNotificationHandler,
  ],
  exports: [ProductApplicationService],
})
export class ProductModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly productCreatedHandler: ProductCreatedNotificationHandler,
  ) {}

  onModuleInit() {
    // Register event handlers
    this.eventBus.subscribe('ProductCreatedEvent', this.productCreatedHandler);
  }
}
