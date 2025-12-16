import { Global, Module } from '@nestjs/common';
import { PaymentGatewayService } from './payment-gateway.service';
import { PayOSService } from './payos.service';

/**
 * Payment Gateway Module - Global module for payment gateway services
 *
 * Provides:
 * - PayOS Payment Gateway Integration
 * - QR Code generation for payments
 * - Payment webhook verification
 * - Unified payment gateway interface via PaymentGatewayService
 *
 * Configuration via ENVIRONMENT from @core/config/env.config
 */
@Global()
@Module({
  providers: [PayOSService, PaymentGatewayService],
  exports: [PayOSService, PaymentGatewayService],
})
export class PaymentGatewayModule {}
