import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { KnockWorkflowService } from '@shared/service/knock-workflow/knock-workflow.service';
import { GetStreamNotificationService } from '@shared/service/getstream-notification/getstream-notification.service';

/**
 * Service for handling GetStream webhook events
 * Implements the notification architecture:
 * - Updates database timestamps
 * - Sends Knock notifications to offline users
 * - Sends real-time events to online users via GetStream notification channels
 */
@Injectable()
export class StreamChatWebhookService {
  private readonly logger = new Logger(StreamChatWebhookService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knockWorkflowService: KnockWorkflowService,
    private readonly getStreamNotificationService: GetStreamNotificationService,
  ) {}

  /**
   * Handle new message event from GetStream
   * This is triggered whenever a message is sent in any channel
   */
  async handleNewMessage(event: any): Promise<void> {
    try {
      const { channel, message, user } = event;

      if (!channel?.id || !message || !user) {
        this.logger.warn('Invalid message.new event structure');
        return;
      }

      this.logger.log(
        `Processing new message in channel ${channel.id} from user ${user.id}`,
      );

      // 1. Update channel timestamp in database
      await this.updateChannelTimestamp(channel.id);

      // 2. Get channel members from database
      const members = await this.getChannelMembers(channel.id);

      if (members.length === 0) {
        this.logger.warn(`No members found for channel ${channel.id}`);
        return;
      }

      // 3. Filter out the sender
      const recipients = members.filter((member) => member.userId !== user.id);

      if (recipients.length === 0) {
        this.logger.log('No recipients to notify (sender was only member)');
        return;
      }

      // 4. Get channel info for notifications
      const channelInfo = await this.getChannelInfo(channel.id);

      // 5. Send notifications to all recipients
      // Note: We send to all recipients. Knock will handle delivery based on user preferences
      // and GetStream notification channels will handle real-time delivery for online users
      await this.notifyRecipients(
        recipients,
        user,
        channel,
        message,
        channelInfo,
      );

      this.logger.log(
        `Successfully processed new message for ${recipients.length} recipients`,
      );
    } catch (error) {
      this.logger.error(
        `Error handling new message event:`,
        error.message,
        error.stack,
      );
      // Don't throw - webhook should always return success
    }
  }

  /**
   * Handle message deleted event
   */
  async handleMessageDeleted(event: any): Promise<void> {
    try {
      const { message } = event;

      if (!message?.id) {
        return;
      }

      // Mark message as deleted in database if it exists
      await this.prisma.chatMessage.updateMany({
        where: { id: message.id },
        data: { isDeleted: true },
      });

      this.logger.log(`Marked message ${message.id} as deleted in database`);
    } catch (error) {
      this.logger.error(
        `Error handling message deleted event:`,
        error.message,
      );
    }
  }

  /**
   * Handle member added to channel event
   */
  async handleMemberAdded(event: any): Promise<void> {
    try {
      const { channel, member, user } = event;

      if (!channel?.id || !member?.user_id) {
        return;
      }

      // Update member count in database
      await this.updateChannelMemberCount(channel.id);

      // Notify the new member about channel invitation
      if (user?.id && user.id !== member.user_id) {
        const channelInfo = await this.getChannelInfo(channel.id);
        const inviter = await this.getUserInfo(user.id);

        // Send Knock notification
        await this.knockWorkflowService.notifyChannelInvitation({
          recipientId: member.user_id,
          inviter: {
            id: user.id,
            name: inviter?.username || 'Someone',
            avatar: inviter?.avatarUrl,
          },
          channelId: channel.id,
          channelName: channelInfo?.name || 'a channel',
        });

        // Send real-time event
        await this.getStreamNotificationService.emitChannelInvitationEvent({
          userId: member.user_id,
          inviterName: inviter?.username || 'Someone',
          channelId: channel.id,
          channelName: channelInfo?.name || 'a channel',
        });
      }

      this.logger.log(
        `Handled member added to channel ${channel.id}: ${member.user_id}`,
      );
    } catch (error) {
      this.logger.error(`Error handling member added event:`, error.message);
    }
  }

  /**
   * Handle member removed from channel event
   */
  async handleMemberRemoved(event: any): Promise<void> {
    try {
      const { channel } = event;

      if (!channel?.id) {
        return;
      }

      // Update member count in database
      await this.updateChannelMemberCount(channel.id);

      this.logger.log(`Updated member count for channel ${channel.id}`);
    } catch (error) {
      this.logger.error(`Error handling member removed event:`, error.message);
    }
  }

  /**
   * Update channel's lastMessageAt timestamp in database
   */
  private async updateChannelTimestamp(channelId: string): Promise<void> {
    try {
      await this.prisma.chatChannel.update({
        where: { id: channelId },
        data: {
          lastMessageAt: new Date(),
          updatedAt: new Date(),
        },
      });

      this.logger.log(`Updated timestamp for channel ${channelId}`);
    } catch (error) {
      this.logger.error(
        `Error updating channel timestamp for ${channelId}:`,
        error.message,
      );
      // Don't throw - this is not critical
    }
  }

  /**
   * Get channel members from database
   */
  private async getChannelMembers(
    channelId: string,
  ): Promise<Array<{ userId: string; role: string }>> {
    try {
      const participants = await this.prisma.chatParticipant.findMany({
        where: {
          channelId,
          isDeleted: false,
        },
        select: {
          userId: true,
          role: true,
        },
      });

      return participants;
    } catch (error) {
      this.logger.error(
        `Error getting channel members for ${channelId}:`,
        error.message,
      );
      return [];
    }
  }

  /**
   * Get channel info from database
   */
  private async getChannelInfo(channelId: string): Promise<any> {
    try {
      const channel = await this.prisma.chatChannel.findUnique({
        where: { id: channelId },
        select: {
          id: true,
          name: true,
          type: true,
          description: true,
        },
      });

      return channel;
    } catch (error) {
      this.logger.error(
        `Error getting channel info for ${channelId}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Get user info from database
   */
  private async getUserInfo(userId: string): Promise<any> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      });

      return user;
    } catch (error) {
      this.logger.error(
        `Error getting user info for ${userId}:`,
        error.message,
      );
      return null;
    }
  }

  /**
   * Update channel member count in database
   */
  private async updateChannelMemberCount(channelId: string): Promise<void> {
    try {
      const memberCount = await this.prisma.chatParticipant.count({
        where: {
          channelId,
          isDeleted: false,
        },
      });

      await this.prisma.chatChannel.update({
        where: { id: channelId },
        data: { memberCount },
      });

      this.logger.log(
        `Updated member count for channel ${channelId}: ${memberCount}`,
      );
    } catch (error) {
      this.logger.error(
        `Error updating member count for ${channelId}:`,
        error.message,
      );
    }
  }

  /**
   * Notify all recipients about new message
   * Sends both Knock notifications and real-time events
   */
  private async notifyRecipients(
    recipients: Array<{ userId: string; role: string }>,
    sender: any,
    channel: any,
    message: any,
    channelInfo: any,
  ): Promise<void> {
    const senderInfo = await this.getUserInfo(sender.id);
    const messagePreview = message.text?.substring(0, 100) || 'New message';
    const channelName = channelInfo?.name || channel.name || 'a channel';

    // Send notifications to all recipients in parallel
    const notifications = recipients.map(async (recipient) => {
      try {
        // Send Knock notification (for push/email/in-app)
        await this.knockWorkflowService.notifyNewMessage({
          recipientId: recipient.userId,
          sender: {
            id: sender.id,
            name: senderInfo?.username || sender.name || 'Someone',
            avatar: senderInfo?.avatarUrl || sender.image,
          },
          channelId: channel.id,
          channelName,
          messagePreview,
        });

        // Send real-time event via GetStream notification channel
        await this.getStreamNotificationService.emitNewMessageEvent({
          userId: recipient.userId,
          senderName: senderInfo?.username || sender.name || 'Someone',
          channelId: channel.id,
          messagePreview,
        });

        this.logger.log(
          `Sent notifications to user ${recipient.userId} for message in channel ${channel.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Error notifying user ${recipient.userId}:`,
          error.message,
        );
        // Continue with other recipients even if one fails
      }
    });

    await Promise.allSettled(notifications);
  }
}
