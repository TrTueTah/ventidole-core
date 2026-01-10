import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderPaidEvent } from '@domain/commerce/order/events/order-paid.event';

/**
 * Order Paid Webhook Handler
 *
 * Handles order paid event and triggers webhooks.
 *
 * Side Effects:
 * - Send webhook to shop's callback URL
 * - Update payment provider (PayOS)
 * - Send confirmation email/notification
 */
@Injectable()
export class OrderPaidWebhookHandler {
  @OnEvent('order.paid')
  async handle(event: OrderPaidEvent): Promise<void> {
    console.log(`[OrderPaid] Order ${event.aggregateId} paid`);
    console.log(`  Payment ID: ${event.paymentId}`);
    console.log(`  Total Amount: ${event.totalAmount}`);

    // TODO: Integrate with PayOS to confirm payment
    // await this.payosService.confirmPayment(event.paymentId);

    // TODO: Send confirmation notification to customer
    // await this.knockService.notify({
    //   userId: customerId,
    //   event: 'order.paid',
    //   data: {
    //     orderId: event.aggregateId,
    //     paymentId: event.paymentId,
    //     totalAmount: event.totalAmount,
    //   },
    // });

    // TODO: Send webhook to shop's callback URL (if configured)
    // await this.httpService.post(shop.webhookUrl, {
    //   event: 'order.paid',
    //   orderId: event.aggregateId,
    //   paymentId: event.paymentId,
    //   totalAmount: event.totalAmount,
    // });
  }
}
