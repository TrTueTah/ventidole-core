import getStreamChatClient from '@core/config/stream-chat.config';
import { Injectable, Logger } from '@nestjs/common';

/**
 * Stream Chat Infrastructure Service
 *
 * Provides Stream Chat authentication tokens for frontend clients.
 * Backend acts as authentication provider only - all channels,
 * messages, and participants are managed by Stream Chat.
 *
 * Responsibilities:
 * - Generate user authentication tokens
 * - Create/update users in Stream Chat (optional sync)
 * - Fetch channel information
 */
@Injectable()
export class StreamChatService {
  private readonly client = getStreamChatClient();
  private readonly logger = new Logger(StreamChatService.name);

  /**
   * Generate Stream Chat authentication token for a user
   *
   * @param userId - Unique user identifier
   * @returns Authentication token for Stream Chat client
   */
  generateUserToken(userId: string): string {
    return this.client.createToken(userId);
  }

  /**
   * Create or update user in Stream Chat
   *
   * This syncs user data from our backend to Stream Chat.
   * Call this when user is created or profile is updated.
   *
   * @param userId - Unique user identifier
   * @param userData - User profile data
   */
  async upsertUser(
    userId: string,
    userData: {
      name: string;
      image?: string;
      role?: string;
    },
  ): Promise<void> {
    await this.client.upsertUser({
      id: userId,
      name: userData.name,
      image: userData.image,
      role: userData.role || 'user',
    });
  }

  /**
   * Delete user from Stream Chat
   *
   * Call this when user is deleted from our system.
   *
   * @param userId - Unique user identifier
   */
  async deleteUser(userId: string): Promise<void> {
    await this.client.deleteUser(userId, {
      mark_messages_deleted: true,
      hard_delete: false, // Soft delete to preserve message history
    });
  }

  /**
   * Get channel information from GetStream
   *
   * Fetches channel metadata including name, member count, and last message time.
   * Returns null if channel doesn't exist.
   *
   * @param channelId - Channel identifier
   * @returns Channel information or null if not found
   */
  async getChannelInfo(channelId: string): Promise<{
    id: string;
    name?: string;
    image?: string;
    memberCount: number;
  } | null> {
    try {
      const channel = this.client.channel('messaging', channelId);

      // Fetch channel data
      await channel.watch();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const channelData: any = channel.data;

      return {
        id: channelData?.id || channelId,
        name: channelData?.name,
        image: channelData?.image,
        memberCount: channelData?.member_count || 0,
      };
    } catch (error) {
      this.logger.error(`Error fetching channel info for ${channelId}:`, error);
      // Return null if channel doesn't exist
      return null;
    }
  }
}
