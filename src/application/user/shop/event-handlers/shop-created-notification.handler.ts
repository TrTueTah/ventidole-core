import { DomainEvent } from '@core/event/domain-event.base';
import { IEventHandler } from '@core/event/event-handler.interface';
import { ShopCreatedEvent } from '@domain/commerce/shop/events/shop-created.event';
import { KnockService } from '@infra/knock/knock.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';

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
export class ShopCreatedNotificationHandler implements IEventHandler {
  private readonly logger = new Logger(ShopCreatedNotificationHandler.name);

  constructor(
    private readonly knockService: KnockService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof ShopCreatedEvent)) {
      return;
    }

    this.logger.log(`Handling ShopCreatedEvent for shop: ${event.aggregateId}`);

    try {
      // Send notification to shop owner
      await this.notifyOwner(event.ownerId, event.aggregateId, event.shopName);

      // TODO: Set up initial shop configuration
      // - Create default payment methods
      // - Set up shipping options
      // - Configure shop settings

      this.logger.log(
        `Successfully processed shop creation: ${event.aggregateId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process shop creation: ${event.aggregateId}`,
        error,
      );
      // Note: We don't throw here - event handlers should be resilient
    }
  }

  private async notifyOwner(
    ownerId: string,
    shopId: string,
    shopName: string,
  ): Promise<void> {
    try {
      await this.knockService.triggerWorkflow(
        'shop-created',
        [ownerId],
        {
          shopId,
          shopName,
          url: `/shops/${shopId}`,
        },
        { id: 'system', name: 'Ventidole' },
      );
      this.logger.log(`Shop creation notification sent to owner: ${ownerId}`);
    } catch (error) {
      this.logger.error(
        `Failed to send shop creation notification to ${ownerId}: ${error.message}`,
      );
      // Don't throw - notification is non-critical
    }
  }
}
