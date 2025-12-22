import getStreamChatClient, {
  getStreamChatApiKey,
} from '@core/config/stream-chat.config';
import { Injectable, Logger } from '@nestjs/common';
import { CreateChannelDto } from './dto/create-channel.dto';
import { CreateStreamUserDto } from './dto/create-user.dto';

@Injectable()
export class StreamChatService {
  private readonly logger = new Logger(StreamChatService.name);

  /**
   * Generate authentication token for a user
   */
  async generateToken(userId: string) {
    try {
      const streamChatClient = getStreamChatClient();
      const token = streamChatClient.createToken(userId);

      this.logger.log(`Generated token for user: ${userId}`);

      return {
        token,
        apiKey: getStreamChatApiKey(),
        userId,
      };
    } catch (error) {
      this.logger.error(`Error generating token for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Create or update a user in Stream Chat
   */
  async createOrUpdateUser(data: CreateStreamUserDto) {
    try {
      const streamChatClient = getStreamChatClient();

      // Build user data - only include role if explicitly provided
      const userData: any = {
        id: data.userId,
        name: data.name,
        image: data.image,
      };

      // Only set role if explicitly provided, otherwise use GetStream default
      if (data.role) {
        userData.role = data.role;
      }

      const user = await streamChatClient.upsertUser(userData);

      this.logger.log(`Created/Updated user in Stream Chat: ${data.userId}`);

      return user;
    } catch (error) {
      this.logger.error(`Error creating/updating user ${data.userId}:`, error);
      throw error;
    }
  }

  /**
   * Create a channel
   */
  async createChannel(data: CreateChannelDto) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel(data.type, data.channelId, {
        name: data.name,
        description: data.description,
        members: data.members,
      });

      await channel.create();

      this.logger.log(`Created channel: ${data.channelId || 'auto-generated'}`);

      return channel.data;
    } catch (error) {
      this.logger.error(`Error creating channel:`, error);
      throw error;
    }
  }

  /**
   * Get user channels
   */
  async getUserChannels(userId: string) {
    try {
      const streamChatClient = getStreamChatClient();
      const filter = { members: { $in: [userId] } };
      const sort = [{ last_message_at: -1 }] as any;

      const channels = await streamChatClient.queryChannels(filter, sort, {
        watch: false,
        state: true,
      });

      this.logger.log(
        `Retrieved ${channels.length} channels for user: ${userId}`,
      );

      return channels.map((channel) => channel.data);
    } catch (error) {
      this.logger.error(`Error getting channels for user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(
    channelType: string,
    channelId: string,
    userId: string,
    text: string,
  ) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel(channelType, channelId);

      const message = await channel.sendMessage({
        text,
        user_id: userId,
      });

      this.logger.log(`Sent message to channel ${channelId}`);

      return message;
    } catch (error) {
      this.logger.error(
        `Error sending message to channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete a user from Stream Chat
   */
  async deleteUser(userId: string) {
    try {
      const streamChatClient = getStreamChatClient();
      await streamChatClient.deleteUser(userId, {
        mark_messages_deleted: true,
        hard_delete: true,
      });

      this.logger.log(`Deleted user from Stream Chat: ${userId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting user ${userId}:`, error);
      throw error;
    }
  }

  /**
   * Add members to a channel
   */
  async addMembers(
    channelType: string,
    channelId: string,
    memberIds: string[],
  ) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel(channelType, channelId);
      await channel.addMembers(memberIds);

      this.logger.log(
        `Added ${memberIds.length} members to channel ${channelId}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error(`Error adding members to channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Remove members from a channel
   */
  async removeMembers(
    channelType: string,
    channelId: string,
    memberIds: string[],
  ) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel(channelType, channelId);
      await channel.removeMembers(memberIds);

      this.logger.log(
        `Removed ${memberIds.length} members from channel ${channelId}`,
      );

      return { success: true };
    } catch (error) {
      this.logger.error(
        `Error removing members from channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Delete a channel
   */
  async deleteChannel(channelType: string, channelId: string) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel(channelType, channelId);
      await channel.delete();

      this.logger.log(`Deleted channel: ${channelId}`);

      return { success: true };
    } catch (error) {
      this.logger.error(`Error deleting channel ${channelId}:`, error);
      throw error;
    }
  }

  /**
   * Get channel messages
   */
  async getChannelMessages(channelType: string, channelId: string, limit = 50) {
    try {
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel(channelType, channelId);

      const messages = await channel.query({
        messages: { limit },
      });

      this.logger.log(
        `Retrieved ${messages.messages.length} messages from channel ${channelId}`,
      );

      return messages.messages;
    } catch (error) {
      this.logger.error(
        `Error getting messages from channel ${channelId}:`,
        error,
      );
      throw error;
    }
  }
}
