import { Injectable, Logger } from '@nestjs/common';
import { getKnockClient, KNOCK_CHANNELS } from './knock.config';

export interface RegisterKnockUserDto {
  userId: string;
  email?: string;
  name?: string;
  avatarUrl?: string;
  role?: string;
}

@Injectable()
export class KnockUserService {
  private readonly logger = new Logger(KnockUserService.name);

  /**
   * Register or update a user in Knock
   */
  async registerUser(data: RegisterKnockUserDto): Promise<void> {
    try {
      const knockClient = getKnockClient();

      await knockClient.users.identify(data.userId, {
        email: data.email,
        name: data.name,
        avatar: data.avatarUrl,
        role: data.role,
      });

      this.logger.log(`Registered user ${data.userId} in Knock`);
    } catch (error) {
      this.logger.error(
        `Failed to register user ${data.userId} in Knock:`,
        error,
      );
      // Don't throw - Knock registration failure shouldn't block user creation
    }
  }

  /**
   * Subscribe user to Knock notification channels
   */
  async subscribeToChannels(
    userId: string,
    fcmToken?: string,
  ): Promise<void> {
    try {
      const knockClient = getKnockClient();

      // Subscribe to in-app notifications
      if (KNOCK_CHANNELS.IN_APP) {
        await knockClient.users.setChannelData(
          userId,
          KNOCK_CHANNELS.IN_APP,
          {
            tokens: fcmToken ? [fcmToken] : [],
          },
        );
      }

      // Subscribe to push notifications
      if (KNOCK_CHANNELS.PUSH && fcmToken) {
        await knockClient.users.setChannelData(
          userId,
          KNOCK_CHANNELS.PUSH,
          {
            tokens: [fcmToken],
          },
        );
      }

      this.logger.log(
        `Subscribed user ${userId} to Knock channels ${fcmToken ? 'with FCM token' : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to subscribe user ${userId} to Knock channels:`,
        error,
      );
    }
  }

  /**
   * Update user's FCM token for push notifications
   */
  async updateFcmToken(userId: string, fcmToken: string): Promise<void> {
    try {
      const knockClient = getKnockClient();

      if (KNOCK_CHANNELS.PUSH) {
        await knockClient.users.setChannelData(
          userId,
          KNOCK_CHANNELS.PUSH,
          {
            tokens: [fcmToken],
          },
        );

        this.logger.log(`Updated FCM token for user ${userId}`);
      }
    } catch (error) {
      this.logger.error(
        `Failed to update FCM token for user ${userId}:`,
        error,
      );
    }
  }

  /**
   * Generate Knock auth token for client-side SDK
   */
  async generateUserToken(userId: string): Promise<string> {
    try {
      const knockClient = getKnockClient();
      const token = await knockClient.users.generateToken(userId);

      this.logger.log(`Generated Knock token for user ${userId}`);
      return token;
    } catch (error) {
      this.logger.error(
        `Failed to generate Knock token for user ${userId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Unsubscribe user from a specific channel
   */
  async unsubscribeFromChannel(
    userId: string,
    channelId: string,
  ): Promise<void> {
    try {
      const knockClient = getKnockClient();

      await knockClient.users.setChannelData(userId, channelId, {
        tokens: [],
      });

      this.logger.log(
        `Unsubscribed user ${userId} from channel ${channelId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to unsubscribe user ${userId} from channel ${channelId}:`,
        error,
      );
    }
  }
}
