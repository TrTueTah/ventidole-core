import { Module } from '@nestjs/common';
import { PayOSWebhookController } from './payos-webhook.controller';
import { PayOSService } from '@infra/payos/payos.service';
import { SubscriptionRepositoryPrisma } from '@infra/prisma/membership/subscription.repository.prisma';
import { MembershipTierRepositoryPrisma } from '@infra/prisma/membership/membership-tier.repository.prisma';
import { PrismaService } from '@infra/prisma/prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { OrderApplicationService } from '@application/user/order/order.service';
import { OrderRepositoryPrisma } from '@infra/prisma/commerce/order/order.repository.prisma';
import { CanViewOrderPolicy } from '@domain/commerce/order/policies/can-view-order.policy';
import { CanManageOrderPolicy } from '@domain/commerce/order/policies/can-manage-order.policy';
import { CanCancelOrderPolicy } from '@domain/commerce/order/policies/can-cancel-order.policy';
import { ConfigService } from '@nestjs/config';

/**
 * PayOS Webhook Module
 *
 * Handles payment confirmation webhooks from PayOS gateway.
 *
 * Provides:
 * - Webhook controller for /webhooks/payos
 * - PayOS service for signature verification
 * - Repository access for subscription and order updates
 */
@Module({
  controllers: [PayOSWebhookController],
  providers: [
    PayOSService,
    PrismaService,
    EventBus,
    ConfigService,

    // Subscription dependencies
    {
      provide: 'SubscriptionRepository',
      useClass: SubscriptionRepositoryPrisma,
    },
    {
      provide: 'MembershipTierRepository',
      useClass: MembershipTierRepositoryPrisma,
    },

    // Order dependencies
    OrderApplicationService,
    {
      provide: 'OrderRepository',
      useClass: OrderRepositoryPrisma,
    },
    CanViewOrderPolicy,
    CanManageOrderPolicy,
    CanCancelOrderPolicy,
  ],
})
export class PayOSWebhookModule {}
