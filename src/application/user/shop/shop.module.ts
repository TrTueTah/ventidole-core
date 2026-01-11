import { Module, OnModuleInit } from '@nestjs/common';
import { ShopController } from './shop.controller';
import { ShopApplicationService } from './shop.service';
import { ShopRepositoryPrisma } from '@infra/prisma/commerce/shop/shop.repository.prisma';
import { CanViewShopPolicy } from '@domain/commerce/shop/policies/can-view-shop.policy';
import { CanManageShopPolicy } from '@domain/commerce/shop/policies/can-manage-shop.policy';
import { EventBus } from '@core/event/event-bus.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { ShopCreatedNotificationHandler } from './event-handlers/shop-created-notification.handler';
import { KnockService } from '@infra/knock/knock.service';

/**
 * Shop Module
 *
 * Wires together:
 * - Shop controller (HTTP layer)
 * - Shop application service (use case orchestration)
 * - Shop repository (Prisma implementation)
 * - Shop policies (authorization)
 * - Shop event handlers (side effects)
 */
@Module({
  controllers: [ShopController],
  providers: [
    // Application Service
    ShopApplicationService,

    // Repository (bind interface to implementation)
    {
      provide: 'ShopRepository',
      useClass: ShopRepositoryPrisma,
    },

    // Policies
    CanViewShopPolicy,
    CanManageShopPolicy,

    // Infrastructure
    EventBus,
    PrismaService,
    KnockService,

    // Event Handlers
    ShopCreatedNotificationHandler,
  ],
  exports: [ShopApplicationService],
})
export class ShopModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly shopCreatedHandler: ShopCreatedNotificationHandler,
  ) {}

  onModuleInit() {
    // Register event handlers
    this.eventBus.subscribe('ShopCreatedEvent', this.shopCreatedHandler);
  }
}
