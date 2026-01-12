import { DomainEvent } from '@core/event/domain-event.base';
import { IEventHandler } from '@core/event/event-handler.interface';
import { UserRegisteredEvent } from '@domain/identity/user/events/user-registered.event';
import { KnockService } from '@infra/knock/knock.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { StreamChatService } from '@infra/stream-chat/stream-chat.service';
import { Injectable, Logger } from '@nestjs/common';

/**
 * User Registered Notification Handler
 *
 * Handles side effects when a new user registers.
 *
 * Responsibilities:
 * - Create user accounts in external services (Stream Chat, Knock)
 * - Send welcome email
 * - Create default profile settings
 * - Trigger analytics event
 * - Setup initial recommendations
 *
 * Note: Event handlers belong in the APPLICATION layer, not domain.
 * They handle SIDE EFFECTS (notifications, integrations, etc.)
 */
@Injectable()
export class UserRegisteredNotificationHandler implements IEventHandler {
  private readonly logger = new Logger(UserRegisteredNotificationHandler.name);

  constructor(
    private readonly knockService: KnockService,
    private readonly streamChatService: StreamChatService,
    private readonly prisma: PrismaService,
  ) {}

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof UserRegisteredEvent)) {
      return;
    }

    this.logger.log(
      `Handling UserRegisteredEvent for user: ${event.userId} (${event.email})`,
    );

    try {
      // Setup external service accounts (Stream Chat, Knock)
      await this.setupExternalAccounts(
        event.userId,
        event.email,
        event.username,
      );

      // Send welcome email/notification
      await this.sendWelcomeEmail(event.userId, event.email, event.username);

      // TODO: Create default profile settings
      await this.createDefaultSettings(event.userId);

      // TODO: Trigger analytics
      await this.trackRegistration(event.userId, event.role);

      this.logger.log(
        `Successfully processed registration for user: ${event.userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to process registration for user: ${event.userId}`,
        error,
      );
      // Note: We don't throw here - event handlers should be resilient
      // Failed handlers should not break the main flow
    }
  }

  /**
   * Setup user accounts in external services (Stream Chat, Knock)
   *
   * This ensures the user exists in all integrated services before
   * any operations (messages, notifications) are attempted.
   */
  private async setupExternalAccounts(
    userId: string,
    email: string,
    username: string,
  ): Promise<void> {
    // Create user in Stream Chat
    try {
      await this.streamChatService.upsertUser(userId, {
        name: username,
        role: 'user',
      });
      this.logger.log(`Created Stream Chat user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to create Stream Chat user ${userId}: ${error.message}`,
      );
      // Don't throw - external service failure shouldn't block registration
    }

    // Identify user in Knock
    try {
      await this.knockService.identifyUser(userId, {
        name: username,
        email: email,
      });
      this.logger.log(`Identified Knock user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to identify Knock user ${userId}: ${error.message}`,
      );
      // Don't throw - external service failure shouldn't block registration
    }
  }

  private async sendWelcomeEmail(
    userId: string,
    email: string,
    username: string,
  ): Promise<void> {
    try {
      await this.knockService.triggerWorkflow(
        'user-welcome',
        [userId],
        {
          username,
          email,
          url: '/welcome',
        },
        { id: 'system', name: 'Ventidole' },
      );
      this.logger.log(`Welcome email sent to: ${email}`);
    } catch (error) {
      this.logger.error(
        `Failed to send welcome email to ${email}: ${error.message}`,
      );
      // Don't throw - notification is non-critical
    }
  }

  private async createDefaultSettings(userId: string): Promise<void> {
    // TODO: Create default notification preferences, etc.
    this.logger.log(`Creating default settings for user: ${userId}`);
  }

  private async trackRegistration(userId: string, role: string): Promise<void> {
    // TODO: Track registration event in analytics (e.g., Mixpanel, Google Analytics)
    this.logger.log(`Tracking registration: ${userId} - ${role}`);
  }
}
