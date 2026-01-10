import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ShopCreatedEvent } from '@domain/commerce/shop/events/shop-created.event';

/**
 * Shop Created Notification Handler
 *
 * Sends notification when a new shop is created.
 *
 * Side Effects:
 * - Send notification to followers
 * - Log shop creation
 * - Set up initial shop configuration
 */
@Injectable()
export class ShopCreatedNotificationHandler {
  @OnEvent('shop.created')
  async handle(event: ShopCreatedEvent): Promise<void> {
    console.log(`[ShopCreated] Shop ${event.aggregateId} created`);
    console.log(`  Owner: ${event.ownerId}`);
    console.log(`  Name: ${event.shopName}`);

    // TODO: Send notification to owner's followers
    // await this.knockService.notify({
    //   userId: event.ownerId,
    //   event: 'shop.created',
    //   data: {
    //     shopId: event.aggregateId,
    //     shopName: event.shopName,
    //   },
    // });

    // TODO: Set up initial shop configuration
    // - Create default payment methods
    // - Set up shipping options
    // - Configure shop settings
  }
}
