import { KnockModule } from '@domain/knock/knock.module';
import { Module } from '@nestjs/common';
import { PaymentGatewayModule } from '@shared/service/payment-gateway/payment-gateway.module';
import { PrismaModule } from '@shared/service/prisma/prisma.module';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { PaymentTransactionService } from './payment-transaction.service';
import { WebhookController } from './webhook.controller';

/**
 * Order Module
 *
 * Handles order creation, payment processing, and webhook handling
 *
 * Features:
 * - Order confirmation (CREDIT/COD)
 * - PayOS payment integration
 * - Payment retry mechanism
 * - Webhook payment confirmation
 * - Order status polling
 *
 * Controllers:
 * - OrderController: /orders endpoints
 * - WebhookController: /webhooks/payos endpoint
 *
 * Services:
 * - OrderService: Order business logic
 * - PaymentTransactionService: Payment transaction management
 */
@Module({
  imports: [PrismaModule, PaymentGatewayModule, KnockModule],
  controllers: [OrderController, WebhookController],
  providers: [OrderService, PaymentTransactionService],
  exports: [OrderService, PaymentTransactionService],
})
export class OrderModule {}
