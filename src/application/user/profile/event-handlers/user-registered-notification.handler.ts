import { Injectable, Logger } from '@nestjs/common';
import { IEventHandler } from '@core/event/event-handler.interface';
import { DomainEvent } from '@core/event/domain-event.base';
import { UserRegisteredEvent } from '@domain/identity/user/events/user-registered.event';

/**
 * User Registered Notification Handler
 *
 * Handles side effects when a new user registers.
 *
 * Responsibilities:
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

  async handle(event: DomainEvent): Promise<void> {
    if (!(event instanceof UserRegisteredEvent)) {
      return;
    }

    this.logger.log(
      `Handling UserRegisteredEvent for user: ${event.userId} (${event.email})`,
    );

    try {
      // TODO: Send welcome email
      await this.sendWelcomeEmail(event.email, event.username);

      // TODO: Create default profile settings
      await this.createDefaultSettings(event.userId);

      // TODO: Trigger analytics
      await this.trackRegistration(event.userId, event.role);

      this.logger.log(`Successfully processed registration for user: ${event.userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to process registration for user: ${event.userId}`,
        error,
      );
      // Note: We don't throw here - event handlers should be resilient
      // Failed handlers should not break the main flow
    }
  }

  private async sendWelcomeEmail(email: string, username: string): Promise<void> {
    // TODO: Integrate with email service (e.g., SendGrid, AWS SES)
    this.logger.log(`Sending welcome email to: ${email}`);
    // await this.emailService.send({
    //   to: email,
    //   template: 'welcome',
    //   data: { username },
    // });
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
