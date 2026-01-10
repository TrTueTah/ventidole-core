import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderCreatedEvent } from '@domain/commerce/order/events/order-created.event';

/**
 * Order Created Notification Handler
 *
 * Sends notification when an order is created.
 *
 * Side Effects:
 * - Send notification to customer
 * - Send notification to shop owner
 * - Log order creation
 */
@Injectable()
export class OrderCreatedNotificationHandler {
  @OnEvent('order.created')
  async handle(event: OrderCreatedEvent): Promise<void> {
    // TODO: Send notification to customer
    console.log(`[OrderCreated] Order ${event.aggregateId} created`);
    console.log(`  Customer: ${event.customerId}`);
    console.log(`  Shop: ${event.shopId}`);
    console.log(`  Total Amount: ${event.totalAmount}`);

    // TODO: Integrate with Knock for push notifications
    // await this.knockService.notify({
    //   userId: event.customerId,
    //   event: 'order.created',
    //   data: {
    //     orderId: event.aggregateId,
    //     totalAmount: event.totalAmount,
    //   },
    // });

    // TODO: Send notification to shop owner
    // await this.knockService.notify({
    //   userId: shopOwnerId,
    //   event: 'order.received',
    //   data: {
    //     orderId: event.aggregateId,
    //     totalAmount: event.totalAmount,
    //   },
    // });
  }
}
