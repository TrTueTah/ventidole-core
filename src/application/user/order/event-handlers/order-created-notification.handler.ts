import { OrderCreatedEvent } from '@domain/commerce/order/events/order-created.event';
import { DomainEvent } from '@core/event/domain-event.base';
import { IEventHandler } from '@core/event/event-handler.interface';
import { Injectable, Logger } from '@nestjs/common';
import { KnockService } from '@infra/knock/knock.service';
import { PrismaService } from '@db/prisma/prisma.service';

/**
 * Order Created Notification Handler
 *
 * Sends notification when an order is created.
 *
 * Side Effects:
 * - Send notification to customer (order confirmation)
 * - Send notification to shop owner (new order received)
 */
@Injectable()
export class OrderCreatedNotificationHandler implements IEventHandler {
  private readonly logger = new Logger(OrderCreatedNotificationHandler.name);

  constructor(
    private readonly knockService: KnockService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof OrderCreatedEvent)) {
      return;
    }

    this.logger.log(
      `Handling OrderCreatedEvent for order: ${event.aggregateId}`,
    );

    try {
      // Get order details
      const order = await this.prisma.order.findUnique({
        where: { id: event.aggregateId },
        select: {
          id: true,
          orderCode: true,
          totalAmount: true,
          customerId: true,
          customer: { select: { id: true, username: true, email: true } },
          shop: {
            select: {
              id: true,
              name: true,
              ownerId: true,
              owner: { select: { id: true, username: true, email: true } },
            },
          },
        },
      });

      if (!order) {
        this.logger.warn(`Order not found: ${event.aggregateId}`);
        return;
      }

      // Send confirmation notification to customer
      await this.knockService.triggerWorkflow(
        'confirm-order',
        [order.customer.id],
        {
          orderId: order.id,
          orderCode: order.orderCode,
          totalAmount: order.totalAmount,
          shopName: order.shop.name,
          url: `/orders/${order.id}`,
        },
        { id: 'system', name: 'Ventidole' },
      );

      this.logger.log(`Notified customer about order: ${order.orderCode}`);

      // Send notification to shop owner
      await this.knockService.triggerWorkflow(
        'shop-owner-new-order',
        [order.shop.ownerId],
        {
          orderId: order.id,
          orderCode: order.orderCode,
          totalAmount: order.totalAmount,
          customerName: order.customer.username,
          url: `/shop/${order.shop.id}/orders/${order.id}`,
        },
        {
          id: order.customer.id,
          name: order.customer.username,
        },
      );

      this.logger.log(`Notified shop owner about order: ${order.orderCode}`);

      this.logger.log(
        `Successfully processed order creation: ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process order creation: ${event.aggregateId}`,
        error,
      );
      // Note: We don't throw here - event handlers should be resilient
    }
  }
}
