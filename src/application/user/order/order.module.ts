import { Module } from '@nestjs/common';
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

    // Event Handlers
    OrderCreatedNotificationHandler,
    OrderPaidWebhookHandler,
  ],
  exports: [OrderApplicationService],
})
export class OrderModule {}
