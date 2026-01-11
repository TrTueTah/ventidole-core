import { DomainEvent } from '@core/event/domain-event.base';
import { IEventHandler } from '@core/event/event-handler.interface';
import { CommunityCreatedEvent } from '@domain/community/community/events/community-created.event';
import { Injectable, Logger } from '@nestjs/common';
import { KnockService } from '@infra/knock/knock.service';
import { PrismaService } from '@db/prisma/prisma.service';

/**
 * Community Created Notification Handler
 *
 * Handles side effects when a new community is created.
 *
 * Responsibilities:
 * - Create default community settings
 * - Send notification to owner
 * - Track analytics event
 * - Setup initial recommendations
 *
 * Note: Event handlers belong in the APPLICATION layer, not domain.
 * They handle SIDE EFFECTS (notifications, integrations, etc.)
 */
@Injectable()
export class CommunityCreatedNotificationHandler implements IEventHandler {
  private readonly logger = new Logger(
    CommunityCreatedNotificationHandler.name,
  );

  constructor(
    private readonly knockService: KnockService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof CommunityCreatedEvent)) {
      return;
    }

    this.logger.log(
      `Handling CommunityCreatedEvent for community: ${event.communityId} (${event.name})`,
    );

    try {
      // TODO: Create default community settings
      await this.createDefaultSettings(event.communityId);

      // Send notification to owner
      await this.notifyOwner(event.ownerId, event.communityId, event.name);

      // TODO: Track analytics
      await this.trackCreation(
        event.communityId,
        event.name,
        event.type,
        event.ownerId,
      );

      this.logger.log(
        `Successfully processed community creation: ${event.communityId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process community creation: ${event.communityId}`,
        error,
      );
      // Note: We don't throw here - event handlers should be resilient
      // Failed handlers should not break the main flow
    }
  }

  private async createDefaultSettings(communityId: string): Promise<void> {
    // TODO: Create default notification preferences, etc.
    this.logger.log(`Creating default settings for community: ${communityId}`);
  }

  private async notifyOwner(
    ownerId: string,
    communityId: string,
    name: string,
  ): Promise<void> {
    try {
      await this.knockService.triggerWorkflow(
        'community-created',
        [ownerId],
        {
          communityId,
          communityName: name,
          url: `/communities/${communityId}`,
        },
        { id: 'system', name: 'Ventidole' },
      );
      this.logger.log(
        `Community creation notification sent to owner: ${ownerId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send community creation notification to ${ownerId}: ${error.message}`,
      );
      // Don't throw - notification is non-critical
    }
  }

  private async trackCreation(
    communityId: string,
    name: string,
    type: string,
    ownerId: string,
  ): Promise<void> {
    // TODO: Track creation event in analytics
    this.logger.log(
      `Tracking community creation: ${communityId} - ${name} (${type})`,
    );
  }
}
