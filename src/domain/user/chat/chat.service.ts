import getStreamChatClient from '@core/config/stream-chat.config';
import { Injectable, Logger } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { ChannelDto } from './dto/channel.dto';
import { CreateChannelDto } from './dto/create-channel.dto';
import { GetMessagesDto } from './dto/get-messages.dto';
import { MessageDto } from './dto/message.dto';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new channel (IDOL only)
   */
  async createChannel(
    userId: string,
    createChannelDto: CreateChannelDto,
  ): Promise<ChannelDto> {
    try {
      // Check if user is IDOL
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { role: true, communityId: true },
      });

      if (!user) {
        throw new CustomError(ErrorCode.UserNotFound);
      }

      if (user.role !== 'IDOL') {
        throw new CustomError(ErrorCode.PermissionDenied);
      }

      // If community channel, verify communityId
      if (createChannelDto.isCommunityChannel) {
        if (!createChannelDto.communityId) {
          throw new CustomError(ErrorCode.InvalidInput);
        }

        // Verify the community exists and belongs to the idol
        const community = await this.prisma.community.findFirst({
          where: {
            id: createChannelDto.communityId,
            idols: {
              some: { id: userId },
            },
          },
        });

        if (!community) {
          throw new CustomError(ErrorCode.CommunityNotFound);
        }
      }

      // Create channel in database
      const channel = await this.prisma.chatChannel.create({
        data: {
          type: createChannelDto.type || 'messaging',
          name: createChannelDto.name,
          image: createChannelDto.image,
          description: createChannelDto.description,
          idolId: userId,
          communityId: createChannelDto.communityId,
          isCommunityChannel: createChannelDto.isCommunityChannel || false,
          memberCount: 1, // Creator is first member
        },
      });

      // Add creator as owner participant
      await this.prisma.chatParticipant.create({
        data: {
          channelId: channel.id,
          userId,
          role: 'owner',
          canSendMessage: true,
        },
      });

      this.logger.log(
        `Channel created in database: ${channel.id} by user: ${userId}`,
      );

      // Create channel in GetStream for real-time messaging
      try {
        const streamChatClient = getStreamChatClient();
        const streamChannel = streamChatClient.channel(
          channel.type,
          channel.id,
          {
            name: channel.name,
            image: channel.image,
            description: channel.description,
            created_by_id: userId,
            community_id: channel.communityId,
          },
        );

        await streamChannel.create();
        await streamChannel.addMembers([userId]);

        this.logger.log(
          `Channel created in GetStream for real-time: ${channel.id}`,
        );
      } catch (streamError) {
        this.logger.error(
          `Error creating channel in GetStream (saved in DB):`,
          streamError,
        );
        // Don't throw error here, channel is already saved in database
      }

      // Return channel DTO
      return {
        id: channel.id,
        type: channel.type,
        name: channel.name,
        image: channel.image,
        memberIds: [userId],
        memberCount: 1,
        lastMessage: undefined,
        unreadCount: 0,
        createdAt: channel.createdAt.toISOString(),
        updatedAt: channel.updatedAt.toISOString(),
      };
    } catch (error) {
      this.logger.error(
        `Error creating channel for user ${userId}:`,
        error.message,
      );

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(ErrorCode.ChatChannelCreationFailed);
    }
  }

  /**
   * Get channels owned by the user (for idols)
   * Includes personal channels and community channels
   */
  async getMyChannels(userId: string): Promise<ChannelDto[]> {
    try {
      // Get user to find their community
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { communityId: true },
      });

      // Build where clause to get both personal and community channels
      const whereClause: any = {
        isDeleted: false,
        OR: [
          { idolId: userId }, // Personal channels owned by idol
        ],
      };

      // Add community channels if user belongs to a community
      if (user?.communityId) {
        whereClause.OR.push({ communityId: user.communityId });
      }

      const channels = await this.prisma.chatChannel.findMany({
        where: whereClause,
        include: {
          participants: {
            where: { isDeleted: false },
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          },
          messages: {
            where: { isDeleted: false },
            orderBy: { createdAt: 'desc' },
            take: 1,
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                },
              },
            },
          },
        },
        orderBy: { updatedAt: 'desc' },
      });

      this.logger.log(
        `Retrieved ${channels.length} channels (personal and community) for user: ${userId}`,
      );

      // Map channels and calculate unread counts
      const channelDtos = await Promise.all(
        channels.map(async (channel) => {
          const dto = this.mapChannelToDto(channel, userId);
          dto.unreadCount = await this.calculateUnreadCount(channel.id, userId);
          return dto;
        }),
      );

      return channelDtos;
    } catch (error) {
      this.logger.error(
        `Error getting channels for user ${userId}:`,
        error.message,
      );
      throw new CustomError(ErrorCode.ChatChannelRetrievalFailed);
    }
  }

  /**
   * Get channels that the user has joined
   */
  async getJoinedChannels(userId: string): Promise<ChannelDto[]> {
    try {
      const participants = await this.prisma.chatParticipant.findMany({
        where: {
          userId,
          isDeleted: false,
          channel: {
            isDeleted: false,
          },
        },
        include: {
          channel: {
            include: {
              participants: {
                where: { isDeleted: false },
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                      avatarUrl: true,
                    },
                  },
                },
              },
              messages: {
                where: { isDeleted: false },
                orderBy: { createdAt: 'desc' },
                take: 1,
                include: {
                  user: {
                    select: {
                      id: true,
                      username: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: {
          channel: {
            updatedAt: 'desc',
          },
        },
      });

      this.logger.log(
        `Retrieved ${participants.length} joined channels for user: ${userId}`,
      );

      // Map channels and calculate unread counts
      const channelDtos = await Promise.all(
        participants.map(async (participant) => {
          const dto = this.mapChannelToDto(participant.channel, userId);
          dto.unreadCount = await this.calculateUnreadCount(
            participant.channel.id,
            userId,
          );
          return dto;
        }),
      );

      return channelDtos;
    } catch (error) {
      this.logger.error(
        `Error getting joined channels for user ${userId}:`,
        error.message,
      );
      throw new CustomError(ErrorCode.ChatChannelRetrievalFailed);
    }
  }

  /**
   * Calculate unread count for a channel
   */
  private async calculateUnreadCount(
    channelId: string,
    userId: string,
  ): Promise<number> {
    // Find user's participant record
    const participant = await this.prisma.chatParticipant.findFirst({
      where: {
        channelId,
        userId,
        isDeleted: false,
      },
      select: {
        lastReadAt: true,
      },
    });

    if (!participant) {
      return 0;
    }

    const lastReadAt = participant.lastReadAt || new Date(0);

    // Count messages after lastReadAt that are not from the current user
    const unreadCount = await this.prisma.chatMessage.count({
      where: {
        channelId,
        createdAt: { gt: lastReadAt },
        userId: { not: userId },
        isDeleted: false,
      },
    });

    return unreadCount;
  }

  /**
   * Map database channel to ChannelDto
   */
  private mapChannelToDto(channel: any, userId: string): ChannelDto {
    const lastMessage = channel.messages?.[0];

    return {
      id: channel.id,
      type: 'messaging',
      name: channel.name,
      image: channel.description,
      memberIds: channel.participants?.map((p: any) => p.userId) || [],
      memberCount: channel.participants?.length || 0,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            text: lastMessage.content,
            createdAt: lastMessage.createdAt.toISOString(),
            user: lastMessage.user
              ? {
                  id: lastMessage.user.id,
                  name: lastMessage.user.name,
                }
              : undefined,
          }
        : undefined,
      unreadCount: 0, // Will be calculated separately
      createdAt: channel.createdAt.toISOString(),
      updatedAt: channel.updatedAt.toISOString(),
    };
  }

  /**
   * Get messages from a channel
   */
  async getChannelMessages(
    userId: string,
    channelId: string,
    query: GetMessagesDto,
  ): Promise<PaginationResponse<MessageDto>> {
    try {
      const { page, limit, offset } = query;

      // Check if user is a member of the channel
      const participant = await this.prisma.chatParticipant.findFirst({
        where: {
          channelId,
          userId,
          isDeleted: false,
        },
      });

      if (!participant) {
        throw new CustomError(ErrorCode.ChatChannelAccessDenied);
      }

      // Build where clause for messages
      const whereClause: any = {
        channelId,
        isDeleted: false,
      };

      // Query messages and count total in parallel
      const [messages, total] = await Promise.all([
        this.prisma.chatMessage.findMany({
          where: whereClause,
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limit,
        }),
        this.prisma.chatMessage.count({
          where: whereClause,
        }),
      ]);

      this.logger.log(
        `Retrieved ${messages.length} messages (page ${page}) from channel ${channelId} for user ${userId}`,
      );

      const messageData = messages.map((message) => ({
        id: message.id,
        text: message.content,
        user: {
          id: message.user.id,
          name: message.user.username,
          image: message.user.avatarUrl || undefined,
        },
        attachments: undefined, // TODO: Implement attachments from metadata
        reactions: undefined, // TODO: Implement reactions tracking
        parentId: undefined, // TODO: Implement parent message tracking
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
      }));

      const pageInfo = new PageInfo(page, limit, total);

      return new PaginationResponse(messageData, pageInfo);
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
      // Check if user is a member and has permission to send messages
      const participant = await this.prisma.chatParticipant.findFirst({
        where: {
          channelId,
          userId,
          isDeleted: false,
        },
      });

      if (!participant) {
        throw new CustomError(ErrorCode.ChatChannelAccessDenied);
      }

      if (!participant.canSendMessage) {
        throw new CustomError(ErrorCode.ChatChannelAccessDenied);
      }

      const now = new Date();

      // Save message to database and update channel's lastMessageAt
      const [message] = await Promise.all([
        this.prisma.chatMessage.create({
          data: {
            content: sendMessageDto.text,
            channelId,
            userId,
          },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                avatarUrl: true,
              },
            },
          },
        }),
        // Update channel's lastMessageAt timestamp
        this.prisma.chatChannel.update({
          where: { id: channelId },
          data: {
            lastMessageAt: now,
            updatedAt: now,
          },
        }),
      ]);

      this.logger.log(
        `Message saved to database for channel ${channelId} by user ${userId}`,
      );

      // Send message to GetStream for real-time delivery
      try {
        const streamChatClient = getStreamChatClient();
        const channel = streamChatClient.channel('messaging', channelId);

        await channel.sendMessage({
          id: message.id,
          text: sendMessageDto.text,
          user_id: userId,
        });

        this.logger.log(
          `Message sent to GetStream for real-time delivery: ${message.id}`,
        );
      } catch (streamError) {
        this.logger.error(
          `Error sending message to GetStream (message saved in DB):`,
          streamError,
        );
        // Don't throw error here, message is already saved in database
      }

      return {
        id: message.id,
        text: message.content,
        user: {
          id: message.user.id,
          name: message.user.username,
          image: message.user.avatarUrl || undefined,
        },
        attachments: undefined,
        reactions: undefined,
        parentId: undefined,
        createdAt: message.createdAt.toISOString(),
        updatedAt: message.updatedAt.toISOString(),
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

  /**
   * Mark channel as read (update lastReadAt to current time)
   */
  async markChannelAsRead(userId: string, channelId: string): Promise<void> {
    try {
      // Check if user is a participant
      const participant = await this.prisma.chatParticipant.findFirst({
        where: {
          channelId,
          userId,
          isDeleted: false,
        },
      });

      if (!participant) {
        throw new CustomError(ErrorCode.ChatChannelAccessDenied);
      }

      // Update lastReadAt to current time
      await this.prisma.chatParticipant.update({
        where: {
          id: participant.id,
        },
        data: {
          lastReadAt: new Date(),
        },
      });

      // Also mark as read in GetStream
      try {
        const streamChatClient = getStreamChatClient();
        const channel = streamChatClient.channel('messaging', channelId);
        await channel.markRead({ user_id: userId });

        this.logger.log(
          `Channel ${channelId} marked as read for user ${userId} in GetStream`,
        );
      } catch (streamError) {
        this.logger.error(
          `Error marking channel as read in GetStream:`,
          streamError,
        );
        // Don't throw error here, lastReadAt is already updated in database
      }

      this.logger.log(
        `Channel ${channelId} marked as read for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error marking channel ${channelId} as read for user ${userId}:`,
        error.message,
      );

      if (error instanceof CustomError) {
        throw error;
      }

      throw new CustomError(ErrorCode.ChatChannelAccessDenied);
    }
  }
}
