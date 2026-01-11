import { Module } from '@nestjs/common';
import { CartController } from './cart.controller';
import { CartApplicationService } from './cart.service';
import { CartRepositoryPrisma } from '@infra/prisma/commerce/cart/cart.repository.prisma';
import { CanManageCartPolicy } from '@domain/commerce/cart/policies/can-manage-cart.policy';
import { EventBus } from '@core/event/event-bus.service';
import { PrismaService } from '@infra/prisma/prisma.service';

/**
 * Cart Module
 *
 * Wires together:
 * - Cart controller (HTTP layer)
 * - Cart application service (use case orchestration)
 * - Cart repository (Prisma implementation)
 * - Cart policies (authorization)
 */
@Module({
  controllers: [CartController],
  providers: [
    // Application Service
    CartApplicationService,

    // Repository (bind interface to implementation)
    {
      provide: 'CartRepository',
      useClass: CartRepositoryPrisma,
    },

    // Policies
    CanManageCartPolicy,

    // Infrastructure
    EventBus,
    PrismaService,
  ],
  exports: [CartApplicationService],
})
export class CartModule {}
