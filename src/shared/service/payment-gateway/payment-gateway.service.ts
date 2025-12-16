import { Injectable } from '@nestjs/common';
import { PayOSService } from './payos.service';

/**
 * Payment Gateway Service - Wrapper service for payment operations
 *
 * This service provides a unified interface for payment gateway operations.
 * Currently supports PayOS, but can be extended to support multiple payment providers.
 *
 * Example usage:
 * ```typescript
 * @Injectable()
 * export class OrderService {
 *   constructor(private readonly paymentGateway: PaymentGatewayService) {}
 *
 *   async createPayment(orderId: number, amount: number) {
 *     const paymentData = {
 *       orderCode: orderId,
 *       amount,
 *       description: `Payment for order #${orderId}`,
 *       cancelUrl: 'https://your-domain.com/payment/cancel',
 *       returnUrl: 'https://your-domain.com/payment/success',
 *     };
 *
 *     const response = await this.paymentGateway.createPayment(paymentData);
 *
 *     return {
 *       qrCode: response.data.qrCode,
 *       checkoutUrl: response.data.checkoutUrl,
 *       paymentLinkId: response.data.paymentLinkId,
 *     };
 *   }
 * }
 * ```
 */
@Injectable()
export class PaymentGatewayService {
  constructor(private readonly payosService: PayOSService) {}

  /**
   * Create a payment request and get QR code
   * @param paymentData Payment request data
   * @returns Payment response with QR code and checkout URL
   */
  async createPayment(paymentData: {
    orderCode: number;
    amount: number;
    description: string;
    cancelUrl: string;
    returnUrl: string;
  }) {
    return this.payosService.createPayment(paymentData);
  }

  /**
   * Verify webhook signature from PayOS
   * @param webhookData Webhook data received from PayOS (data object only)
   * @param receivedSignature Signature from webhook payload
   * @returns Boolean indicating if signature is valid
   */
  verifyWebhookSignature(
    webhookData: Record<string, any>,
    receivedSignature: string,
  ): boolean {
    return this.payosService.verifyWebhookSignature(
      webhookData,
      receivedSignature,
    );
  }
}
