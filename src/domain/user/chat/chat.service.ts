import getStreamChatClient from '@core/config/stream-chat.config';
import { Injectable, Logger } from '@nestjs/common';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { ChannelDto } from './dto/channel.dto';
import { MessageDto } from './dto/message.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { GetMessagesDto } from './dto/get-messages.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  /**
   * Get all channels for a user
   */
  async getUserChannels(userId: string): Promise<ChannelDto[]> {
    try {
      const streamChatClient = getStreamChatClient();

      const filter = {
        type: 'messaging',
        members: { $in: [userId] },
      };

      const sort = [{ last_message_at: -1 }] as any;

      const channels = await streamChatClient.queryChannels(filter, sort, {
        watch: false,
        state: true,
      });

      this.logger.log(
        `Retrieved ${channels.length} channels for user: ${userId}`,
      );

      return channels.map((channel) => {
        const state = channel.state;
        const lastMessage = state.messages[state.messages.length - 1];

        return {
          id: channel.cid,
          type: channel.type,
          name: channel.data?.name,
          image: channel.data?.image,
          memberIds: Object.keys(state.members || {}),
          memberCount: Object.keys(state.members || {}).length,
          lastMessage: lastMessage
            ? {
                id: lastMessage.id,
                text: lastMessage.text || '',
                createdAt: lastMessage.created_at
                  ? new Date(lastMessage.created_at).toISOString()
                  : new Date().toISOString(),
                user: lastMessage.user
                  ? {
                      id: lastMessage.user.id,
                      name: lastMessage.user.name || '',
                    }
                  : undefined,
              }
            : undefined,
          unreadCount: state.read?.[userId]?.unread_messages || 0,
          createdAt: channel.data?.created_at
            ? new Date(channel.data.created_at).toISOString()
            : new Date().toISOString(),
          updatedAt: channel.data?.updated_at
            ? new Date(channel.data.updated_at).toISOString()
            : new Date().toISOString(),
        };
      });
    } catch (error) {
      this.logger.error(
        `Error getting channels for user ${userId}:`,
        error.message,
      );
      throw new CustomError(ErrorCode.ChatChannelRetrievalFailed);
    }
  }

  /**
   * Get messages from a channel
   */
  async getChannelMessages(
    userId: string,
    channelId: string,
    query: GetMessagesDto,
  ): Promise<MessageDto[]> {
    try {
      const streamChatClient = getStreamChatClient();

      // Parse channel type and ID from cid (format: "messaging:channel-id")
      const [type, id] = channelId.split(':');

      if (!type || !id) {
        throw new CustomError(ErrorCode.InvalidChannelId);
      }

      const channel = streamChatClient.channel(type, id);

      // Check if user is a member of the channel
      const channelState = await channel.watch();

      const isMember = Object.keys(channelState.members).includes(userId);
      if (!isMember) {
        throw new CustomError(ErrorCode.ChatChannelAccessDenied);
      }

      // Query messages
      const queryOptions: any = {
        messages: {
          limit: query.limit || 50,
        },
      };

      if (query.messageId) {
        queryOptions.messages.id_lt = query.messageId;
      }

      const response = await channel.query(queryOptions);

      this.logger.log(
        `Retrieved ${response.messages.length} messages from channel ${channelId} for user ${userId}`,
      );

      return response.messages.map((message) => ({
        id: message.id,
        text: message.text || '',
        user: {
          id: message.user?.id || '',
          name: message.user?.name || '',
          image: message.user?.image,
        },
        attachments: message.attachments?.map((att) => ({
          type: att.type || '',
          image_url: att.image_url,
          file_size: att.file_size,
          mime_type: att.mime_type,
        })),
        reactions: message.reaction_groups
          ? Object.entries(message.reaction_groups).reduce(
              (acc, [type, group]: [string, any]) => {
                acc[type] = group.users?.map((u: any) => u.id) || [];
                return acc;
              },
              {} as Record<string, string[]>,
            )
          : undefined,
        parentId: message.parent_id,
        createdAt: message.created_at
          ? new Date(message.created_at).toISOString()
          : new Date().toISOString(),
        updatedAt: message.updated_at
          ? new Date(message.updated_at).toISOString()
          : new Date().toISOString(),
      }));
    } catch (error) {
      this.logger.error(
        `Error getting messages from channel ${channelId}:`,
        error.message,
      );

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(ErrorCode.ChatMessageRetrievalFailed);
    }
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(
    userId: string,
    channelId: string,
    sendMessageDto: SendMessageDto,
  ): Promise<MessageDto> {
    try {
      const streamChatClient = getStreamChatClient();

      // Parse channel type and ID from cid
      const [type, id] = channelId.split(':');

      if (!type || !id) {
        throw new CustomError(ErrorCode.InvalidChannelId);
      }

      const channel = streamChatClient.channel(type, id);

      // Check if user is a member
      const channelState = await channel.watch();

      const isMember = Object.keys(channelState.members).includes(userId);
      if (!isMember) {
        throw new CustomError(ErrorCode.ChatChannelAccessDenied);
      }

      // Send message
      const messageData: any = {
        text: sendMessageDto.text,
        user_id: userId,
      };

      if (sendMessageDto.parentId) {
        messageData.parent_id = sendMessageDto.parentId;
      }

      const response = await channel.sendMessage(messageData);

      this.logger.log(
        `Message sent to channel ${channelId} by user ${userId}`,
      );

      const message = response.message;

      return {
        id: message.id,
        text: message.text || '',
        user: {
          id: message.user?.id || userId,
          name: message.user?.name || '',
          image: message.user?.image,
        },
        attachments: message.attachments?.map((att) => ({
          type: att.type || '',
          image_url: att.image_url,
          file_size: att.file_size,
          mime_type: att.mime_type,
        })),
        reactions: undefined,
        parentId: message.parent_id,
        createdAt: message.created_at
          ? new Date(message.created_at).toISOString()
          : new Date().toISOString(),
        updatedAt: message.updated_at
          ? new Date(message.updated_at).toISOString()
          : new Date().toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error sending message to channel ${channelId}:`,
        error.message,
      );

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(ErrorCode.ChatMessageSendFailed);
    }
  }
}
