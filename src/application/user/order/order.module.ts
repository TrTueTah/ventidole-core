import { Module, OnModuleInit } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderApplicationService } from './order.service';
import { OrderRepositoryPrisma } from '@infra/prisma/commerce/order/order.repository.prisma';
import { CanViewOrderPolicy } from '@domain/commerce/order/policies/can-view-order.policy';
import { CanManageOrderPolicy } from '@domain/commerce/order/policies/can-manage-order.policy';
import { CanCancelOrderPolicy } from '@domain/commerce/order/policies/can-cancel-order.policy';
import { EventBus } from '@core/event/event-bus.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { OrderCreatedNotificationHandler } from './event-handlers/order-created-notification.handler';
import { OrderPaidWebhookHandler } from './event-handlers/order-paid-webhook.handler';
import { KnockService } from '@infra/knock/knock.service';
import { PayOSService } from '@infra/payos/payos.service';
import { ConfigService } from '@nestjs/config';
import { CartModule } from '@application/user/cart/cart.module';

/**
 * Order Module
 *
 * Wires together:
 * - Order controller (HTTP layer)
 * - Order application service (use case orchestration)
 * - Order repository (Prisma implementation)
 * - Order policies (authorization)
 * - Order event handlers (side effects)
 */
@Module({
  imports: [CartModule],
  controllers: [OrderController],
  providers: [
    // Application Service
    OrderApplicationService,

    // Repository (bind interface to implementation)
    {
      provide: 'OrderRepository',
      useClass: OrderRepositoryPrisma,
    },

    // Policies
    CanViewOrderPolicy,
    CanManageOrderPolicy,
    CanCancelOrderPolicy,

    // Infrastructure
    EventBus,
    PrismaService,
    KnockService,
    PayOSService,
    ConfigService,

    // Event Handlers
    OrderCreatedNotificationHandler,
    OrderPaidWebhookHandler,
  ],
  exports: [OrderApplicationService],
})
export class OrderModule implements OnModuleInit {
  constructor(
    private readonly eventBus: EventBus,
    private readonly orderCreatedHandler: OrderCreatedNotificationHandler,
  ) {}

  onModuleInit() {
    // Register event handlers
    this.eventBus.subscribe('OrderCreatedEvent', this.orderCreatedHandler);
  }
}
