import { DomainEvent } from '@core/event/domain-event.base';
import { IEventHandler } from '@core/event/event-handler.interface';
import { Injectable, Logger } from '@nestjs/common';
import { ProductCreatedEvent } from '@domain/commerce/product/events/product-created.event';
import { KnockService } from '@infra/knock/knock.service';
import { PrismaService } from '@db/prisma/prisma.service';

/**
 * Product Created Notification Handler
 *
 * Sends notification when a new product is created.
 *
 * Side Effects:
 * - Send notification to shop followers
 * - Index product for search
 * - Log product creation
 */
@Injectable()
export class ProductCreatedNotificationHandler implements IEventHandler {
  private readonly logger = new Logger(ProductCreatedNotificationHandler.name);

  constructor(
    private readonly knockService: KnockService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof ProductCreatedEvent)) {
      return;
    }

    this.logger.log(
      `Handling ProductCreatedEvent for product: ${event.aggregateId}`,
    );

    try {
      // Send notification to shop owner about new product
      await this.notifyShopOwner(
        event.shopId,
        event.aggregateId,
        event.productName,
      );

      // TODO: Index product for search (Elasticsearch, Algolia, etc.)
      // await this.searchService.indexProduct(event.aggregateId);

      this.logger.log(
        `Successfully processed product creation: ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process product creation: ${event.aggregateId}`,
        error,
      );
      // Note: We don't throw here - event handlers should be resilient
    }
  }

  private async notifyShopOwner(
    shopId: string,
    productId: string,
    productName: string,
  ): Promise<void> {
    try {
      // Fetch shop details to get owner
      const shop = await this.prisma.shop.findUnique({
        where: { id: shopId },
        select: { ownerId: true },
      });

      if (!shop) {
        this.logger.warn(`Shop not found: ${shopId}`);
        return;
      }

      await this.knockService.triggerWorkflow(
        'product-created',
        [shop.ownerId],
        {
          productId,
          productName,
          shopId,
          url: `/products/${productId}`,
        },
        { id: 'system', name: 'Ventidole' },
      );
      this.logger.log(
        `Product creation notification sent to shop owner: ${shop.ownerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send product creation notification for ${productId}: ${error.message}`,
      );
      // Don't throw - notification is non-critical
    }
  }
}
