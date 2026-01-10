import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ProductCreatedEvent } from '@domain/commerce/product/events/product-created.event';

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
export class ProductCreatedNotificationHandler {
  @OnEvent('product.created')
  async handle(event: ProductCreatedEvent): Promise<void> {
    console.log(`[ProductCreated] Product ${event.aggregateId} created`);
    console.log(`  Shop: ${event.shopId}`);
    console.log(`  Name: ${event.productName}`);

    // TODO: Integrate with Knock to notify shop followers
    // await this.knockService.notify({
    //   shopId: event.shopId,
    //   event: 'product.created',
    //   data: {
    //     productId: event.aggregateId,
    //     productName: event.productName,
    //   },
    // });

    // TODO: Index product for search (Elasticsearch, Algolia, etc.)
    // await this.searchService.indexProduct(event.aggregateId);
  }
}
