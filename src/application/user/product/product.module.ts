import { Module } from '@nestjs/common';
import { ProductController } from './product.controller';
import { ProductApplicationService } from './product.service';
import { ProductRepositoryPrisma } from '@infra/prisma/commerce/product/product.repository.prisma';
import { CanViewProductPolicy } from '@domain/commerce/product/policies/can-view-product.policy';
import { CanManageProductPolicy } from '@domain/commerce/product/policies/can-manage-product.policy';
import { EventBus } from '@core/event/event-bus.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { ProductCreatedNotificationHandler } from './event-handlers/product-created-notification.handler';

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

    // Infrastructure
    EventBus,
    PrismaService,

    // Event Handlers
    ProductCreatedNotificationHandler,
  ],
  exports: [ProductApplicationService],
})
export class ProductModule {}
