import { DomainEvent } from '@core/event/domain-event.base';
import { IEventHandler } from '@core/event/event-handler.interface';
import { UserProfileUpdatedEvent } from '@domain/identity/user/events/user-profile-updated.event';
import { KnockService } from '@infra/knock/knock.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { StreamChatService } from '@infra/stream-chat/stream-chat.service';
import { Injectable, Logger } from '@nestjs/common';

/**
 * User Profile Updated Sync Handler
 *
 * Handles syncing profile updates to external services (Stream Chat, Knock).
 *
 * Responsibilities:
 * - Sync username/avatar changes to Stream Chat
 * - Sync username/avatar/email changes to Knock
 * - Ensure external services stay in sync with our database
 *
 * Note: This handler is non-blocking - external service failures
 * won't prevent profile updates from completing.
 */
@Injectable()
export class UserProfileUpdatedSyncHandler implements IEventHandler {
  private readonly logger = new Logger(UserProfileUpdatedSyncHandler.name);

  constructor(
    private readonly knockService: KnockService,
    private readonly streamChatService: StreamChatService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof UserProfileUpdatedEvent)) {
      return;
    }

    this.logger.log(
      `Handling UserProfileUpdatedEvent for user: ${event.userId}`,
    );

    try {
      // Fetch current user data from database (need email for Knock)
      const user = await this.prisma.user.findUnique({
        where: { id: event.userId },
        select: {
          id: true,
          username: true,
          email: true,
          avatarUrl: true,
        },
      });

      if (!user) {
        this.logger.warn(`User not found: ${event.userId}`);
        return;
      }

      // Sync to external services
      await this.syncToStreamChat(user);
      await this.syncToKnock(user);

      this.logger.log(
        `Successfully synced profile updates for user: ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync profile updates for user: ${event.userId}`,
        error,
      );
      // Don't throw - external service sync failures shouldn't break profile updates
    }
  }

  /**
   * Sync updated profile data to Stream Chat
   */
  private async syncToStreamChat(user: {
    id: string;
    username: string;
    avatarUrl: string | null;
  }): Promise<void> {
    try {
      await this.streamChatService.upsertUser(user.id, {
        name: user.username,
        image: user.avatarUrl || undefined,
        role: 'user',
      });

      this.logger.log(`Synced profile to Stream Chat: ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to sync profile to Stream Chat ${user.id}: ${error.message}`,
      );
      // Don't throw - non-critical
    }
  }

  /**
   * Sync updated profile data to Knock
   */
  private async syncToKnock(user: {
    id: string;
    username: string;
    email: string;
    avatarUrl: string | null;
  }): Promise<void> {
    try {
      await this.knockService.identifyUser(user.id, {
        name: user.username,
        email: user.email,
        avatar: user.avatarUrl || undefined,
      });

      this.logger.log(`Synced profile to Knock: ${user.id}`);
    } catch (error) {
      this.logger.error(
        `Failed to sync profile to Knock ${user.id}: ${error.message}`,
      );
      // Don't throw - non-critical
    }
  }
}
