import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { FirebaseService } from '@shared/service/firebase/firebase.service';
import { NotificationService } from '@shared/service/notification/notification.service';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { ChatChannelType, ChatRole, ChatChannel, ChatParticipant, Role } from 'src/db/prisma/enums';
import { CreateChannelRequest } from './request/create-channel.request';
import { SendMessageRequest } from './request/send-message.request';
import { AddParticipantsRequest } from './request/add-participants.request';
import { MarkAsReadRequest } from './request/mark-as-read.request';
import { UpdateMessageRequest } from './request/update-message.request';
import { DeleteMessageRequest } from './request/delete-message.request';
import { ArchiveChannelRequest } from './request/archive-channel.request';
import { ChatMessage } from './interface/chat.interface';
import { ChatChannelResponse, ChatMessageResponse } from './response/chat.response';
import { getCollection } from 'src/db/firebase/get-collection';
import { ChatConstants } from './chat.constants';
import * as admin from 'firebase-admin';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly collections = getCollection();

  constructor(
    private readonly prisma: PrismaService,
    private readonly firebaseService: FirebaseService,
    private readonly notificationService: NotificationService,
  ) {}

  /**
   * Create a new chat channel
   */
  async createChannel(body: CreateChannelRequest, request: IRequest): Promise<BaseResponse<ChatChannelResponse>> {
    // Validate request.user exists
    if (!request.user || !request.user.id) {
      this.logger.error('User not found in request', { user: request.user });
      throw new CustomError(ErrorCode.Unauthenticated);
    }

    const userId = request.user.id;

    // Validate channel type requirements
    if (body.type === ChatChannelType.GROUP && !body.groupId) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    if (body.type === ChatChannelType.ANNOUNCEMENT && !body.idolId) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Validate participant limit
    if (body.participantIds && body.participantIds.length > ChatConstants.MAX_PARTICIPANTS_GROUP_CHAT) {
      this.logger.warn(`Attempt to create channel with ${body.participantIds.length} participants`);
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // For announcement channels, verify user is an idol
    if (body.isAnnouncement) {
      const idol = await this.prisma.user.findUnique({
        where: { id: userId, role: Role.IDOL },
      });

      if (!idol) {
        throw new CustomError(ErrorCode.Unauthorized);
      }
    }

    // Generate Firebase document ID
    const firebaseDocId = this.firebaseService.getFirestore().collection(this.collections.chatMessages).doc().id;

    // Create channel in PostgreSQL
    const channel = await this.prisma.chatChannel.create({
      data: {
        name: body.name,
        description: body.description,
        type: body.type,
        groupId: body.groupId,
        idolId: body.idolId,
        isAnnouncement: body.isAnnouncement || false,
        firebaseDocId,
      },
      include: {
        group: true,
        idol: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
      },
    });

    // Add channel creator as admin participant
    await this.prisma.chatParticipant.create({
      data: {
        channelId: channel.id,
        userId,
        role: ChatRole.ADMIN,
      },
    });

    // Add additional participants if provided
    if (body.participantIds && body.participantIds.length > 0) {
      await this.prisma.chatParticipant.createMany({
        data: body.participantIds
          .filter(id => id !== userId)
          .map(participantId => ({
            channelId: channel.id,
            userId: participantId,
            role: ChatRole.MEMBER,
          })),
      });
    }

    return BaseResponse.of(channel);
  }

  /**
   * Get all channels for current user
   */
  async getMyChannels(request: IRequest): Promise<BaseResponse<ChatChannelResponse[]>> {
    const userId = request.user.id;

    const participants = await this.prisma.chatParticipant.findMany({
      where: {
        userId,
        isActive: true,
      },
      include: {
        channel: {
          include: {
            group: true,
            idol: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    role: true,
                    isOnline: true,
                    fan: true,
                    idol: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        channel: {
          lastMessageAt: 'desc',
        },
      },
    });

    const channels = participants.map(p => ({
      ...p.channel,
      unreadCount: p.unreadCount,
      lastReadAt: p.lastReadAt,
      isMuted: p.isMuted,
    }));

    return BaseResponse.of(channels);
  }

  /**
   * Get chat channels by user ID
   */
  async getChatChannelByUserId(userId: string, request: IRequest): Promise<BaseResponse<ChatChannelResponse[]>> {
    // Get the requesting user's ID
    const requestingUserId = request.user.id;

    // Find channels where both users are participants
    const participants = await this.prisma.chatParticipant.findMany({
      where: {
        userId,
        isActive: true,
        channel: {
          participants: {
            some: {
              userId: requestingUserId,
              isActive: true,
            },
          },
        },
      },
      include: {
        channel: {
          include: {
            group: true,
            idol: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
            participants: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    role: true,
                    isOnline: true,
                    fan: true,
                    idol: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        channel: {
          lastMessageAt: 'desc',
        },
      },
    });

    const channels = participants.map(p => p.channel);

    return BaseResponse.of(channels);
  }

  /**
   * Get channel by ID
   */
  async getChannelById(channelId: string, request: IRequest): Promise<BaseResponse<ChatChannelResponse>> {
    const userId = request.user.id;

    // Verify user is a participant
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new CustomError(ErrorCode.Unauthorized);
    }

    const channel = await this.prisma.chatChannel.findUnique({
      where: { id: channelId },
      include: {
        group: true,
        idol: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
              },
            },
          },
        },
        participants: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                role: true,
                isOnline: true,
                fan: true,
                idol: true,
              },
            },
          },
        },
      },
    });

    if (!channel) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    return BaseResponse.of(channel);
  }

  /**
   * Send a message to a channel
   */
  async sendMessage(body: SendMessageRequest, request: IRequest): Promise<BaseResponse<ChatMessageResponse>> {
    const userId = request.user.id;
    const { channelId, type, content, mediaUrl, thumbnailUrl, metadata, replyTo } = body;

    // Verify channel exists and user is a participant
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
      include: {
        channel: true,
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            fan: true,
            idol: true,
          },
        },
      },
    });

    if (!participant) {
      throw new CustomError(ErrorCode.Unauthorized);
    }

    // For announcement channels, only admins can send messages
    if (participant.channel.isAnnouncement && participant.role !== ChatRole.ADMIN) {
      throw new CustomError(ErrorCode.Unauthorized);
    }

    // Get sender info
    const senderName = participant.user.fan?.username || participant.user.idol?.stageName || participant.user.email;
    const senderAvatar = participant.user.fan?.avatarUrl || participant.user.idol?.avatarUrl || undefined;

    // Create message in Firebase
    const message: Omit<ChatMessage, 'id'> = {
      channelId,
      senderId: userId,
      senderName,
      senderAvatar,
      type,
      content,
      mediaUrl,
      thumbnailUrl,
      metadata,
      replyTo,
      createdAt: new Date(),
      updatedAt: new Date(),
      isDeleted: false,
      readBy: [userId],
    };

    const firestore = this.firebaseService.getFirestore();
    const messageRef = await firestore
      .collection(this.collections.chatMessages)
      .add(message);

    const savedMessage = {
      id: messageRef.id,
      ...message,
    };

    // Update channel metadata in PostgreSQL
    await this.prisma.chatChannel.update({
      where: { id: channelId },
      data: {
        lastMessageAt: new Date(),
      },
    });

    // Increment unread count for other participants
    await this.prisma.chatParticipant.updateMany({
      where: {
        channelId,
        userId: { not: userId },
      },
      data: {
        unreadCount: { increment: 1 },
      },
    });

    // Send push notifications to participants
    await this.sendMessageNotifications(channelId, userId, senderName, content);

    return BaseResponse.of(savedMessage);
  }

  /**
   * Get messages from a channel with pagination
   */
  async getMessages(
    channelId: string,
    limit: number = ChatConstants.DEFAULT_MESSAGE_LIMIT,
    lastMessageId?: string,
    request?: IRequest,
  ): Promise<BaseResponse<{ data: ChatMessageResponse[]; pagination: { hasMore: boolean; limit: number; lastMessageId?: string } }>> {
    const userId = request?.user?.id;

    // Verify user is a participant if request is provided
    if (userId) {
      const participant = await this.prisma.chatParticipant.findUnique({
        where: {
          channelId_userId: {
            channelId,
            userId,
          },
        },
      });

      if (!participant) {
        throw new CustomError(ErrorCode.Unauthorized);
      }
    }

    // Cap the limit to prevent abuse
    const cappedLimit = Math.min(limit, ChatConstants.MAX_MESSAGE_LIMIT);

    const firestore = this.firebaseService.getFirestore();
    let query = firestore
      .collection(this.collections.chatMessages)
      .where('channelId', '==', channelId)
      .where('isDeleted', '==', false)
      .orderBy('createdAt', 'desc')
      .limit(cappedLimit + 1); // Fetch one extra to check if there are more

    // Pagination support
    if (lastMessageId) {
      const lastDoc = await firestore
        .collection(this.collections.chatMessages)
        .doc(lastMessageId)
        .get();

      if (lastDoc.exists) {
        query = query.startAfter(lastDoc);
      }
    }

    const snapshot = await query.get();
    const hasMore = snapshot.docs.length > cappedLimit;
    const messages = snapshot.docs
      .slice(0, cappedLimit)
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
      })) as ChatMessageResponse[];

    const newLastMessageId = messages.length > 0 ? messages[messages.length - 1].id : undefined;

    return BaseResponse.of({
      data: messages,
      pagination: {
        hasMore,
        limit: cappedLimit,
        lastMessageId: newLastMessageId,
      },
    });
  }

  /**
   * Mark messages as read
   */
  async markAsRead(body: MarkAsReadRequest, request: IRequest) {
    const userId = request.user.id;
    const { channelId } = body;

    // Verify participant exists
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new CustomError(ErrorCode.Unauthorized);
    }

    // Update last read time and reset unread count
    await this.prisma.chatParticipant.update({
      where: {
        id: participant.id,
      },
      data: {
        lastReadAt: new Date(),
        unreadCount: 0,
      },
    });

    return BaseResponse.ok();
  }

  /**
   * Add participants to a channel
   */
  async addParticipants(body: AddParticipantsRequest, request: IRequest): Promise<BaseResponse<{ added: number }>> {
    const userId = request.user.id;
    const { channelId, userIds } = body;

    // Verify user is an admin of the channel
    const currentParticipant = await this.prisma.chatParticipant.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!currentParticipant || currentParticipant.role !== ChatRole.ADMIN) {
      throw new CustomError(ErrorCode.Unauthorized);
    }

    // Check current participant count
    const currentCount = await this.prisma.chatParticipant.count({
      where: { channelId, isActive: true },
    });

    if (currentCount + userIds.length > ChatConstants.MAX_PARTICIPANTS_PER_CHANNEL) {
      this.logger.warn(`Channel ${channelId} would exceed participant limit`);
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Add new participants
    const newParticipants = await this.prisma.chatParticipant.createMany({
      data: userIds.map(participantId => ({
        channelId,
        userId: participantId,
        role: ChatRole.MEMBER,
      })),
      skipDuplicates: true,
    });

    return BaseResponse.of({ added: newParticipants.count });
  }

  /**
   * Leave a channel
   */
  async leaveChannel(channelId: string, request: IRequest) {
    const userId = request.user.id;

    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!participant) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    await this.prisma.chatParticipant.update({
      where: { id: participant.id },
      data: { isActive: false },
    });

    return BaseResponse.ok();
  }

  /**
   * Update a message
   */
  async updateMessage(body: UpdateMessageRequest, request: IRequest): Promise<BaseResponse<ChatMessageResponse>> {
    const userId = request.user.id;
    const { messageId, content } = body;

    const firestore = this.firebaseService.getFirestore();
    const messageRef = firestore.collection(this.collections.chatMessages).doc(messageId);
    const messageDoc = await messageRef.get();

    if (!messageDoc.exists) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    const messageData = messageDoc.data() as ChatMessage;

    // Only sender can edit their message
    if (messageData.senderId !== userId) {
      throw new CustomError(ErrorCode.Unauthorized);
    }

    // Check if message is too old to edit
    const messageAge = Date.now() - messageData.createdAt.getTime();
    if (messageAge > ChatConstants.MESSAGE_EDIT_TIMEOUT) {
      this.logger.warn(`User ${userId} attempted to edit old message ${messageId}`);
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Update message
    await messageRef.update({
      content,
      updatedAt: new Date(),
    });

    const updatedMessage = {
      ...messageData,
      id: messageId,
      content,
      updatedAt: new Date(),
    } as ChatMessageResponse;

    return BaseResponse.of(updatedMessage);
  }

  /**
   * Delete a message (soft delete)
   */
  async deleteMessage(body: DeleteMessageRequest, request: IRequest): Promise<BaseResponse<{ messageId: string }>> {
    const userId = request.user.id;
    const { messageId, channelId } = body;

    const firestore = this.firebaseService.getFirestore();
    const messageRef = firestore.collection(this.collections.chatMessages).doc(messageId);
    const messageDoc = await messageRef.get();

    if (!messageDoc.exists) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    const messageData = messageDoc.data() as ChatMessage;

    // Verify message belongs to the channel
    if (messageData.channelId !== channelId) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Check if user can delete (sender or channel admin)
    const canDelete = messageData.senderId === userId || await this.isChannelAdmin(channelId, userId);

    if (!canDelete) {
      throw new CustomError(ErrorCode.Unauthorized);
    }

    // Soft delete
    await messageRef.update({
      isDeleted: true,
      updatedAt: new Date(),
    });

    return BaseResponse.of({ messageId });
  }

  /**
   * Archive a channel
   */
  async archiveChannel(body: ArchiveChannelRequest, request: IRequest): Promise<BaseResponse<unknown>> {
    const userId = request.user.id;
    const { channelId } = body;

    // Verify user is an admin of the channel
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    if (!participant || participant.role !== ChatRole.ADMIN) {
      throw new CustomError(ErrorCode.Unauthorized);
    }

    // Archive channel (soft delete)
    await this.prisma.chatChannel.update({
      where: { id: channelId },
      data: {
        updatedAt: new Date(),
        // You might want to add an isArchived field to the schema
      },
    });

    // Deactivate all participants
    await this.prisma.chatParticipant.updateMany({
      where: { channelId },
      data: { isActive: false },
    });

    return BaseResponse.ok();
  }

  /**
   * Check if user is a channel admin
   */
  private async isChannelAdmin(channelId: string, userId: string): Promise<boolean> {
    const participant = await this.prisma.chatParticipant.findUnique({
      where: {
        channelId_userId: {
          channelId,
          userId,
        },
      },
    });

    return participant?.role === ChatRole.ADMIN;
  }

  /**
   * Send push notifications to channel participants
   */
  private async sendMessageNotifications(
    channelId: string,
    senderId: string,
    senderName: string,
    content: string,
  ) {
    try {
      const participants = await this.prisma.chatParticipant.findMany({
        where: {
          channelId,
          userId: { not: senderId },
          isActive: true,
          isMuted: false,
        },
        include: {
          user: {
            select: {
              deviceToken: true,
            },
          },
        },
      });

      const tokens = participants
        .map(p => p.user.deviceToken)
        .filter(token => token !== null && token !== undefined) as string[];

      if (tokens.length > 0) {
        await this.notificationService.sendToMultipleDevices({
          tokens,
          title: senderName,
          body: content,
          data: {
            type: 'chat_message',
            channelId,
            senderId,
          },
        });
      }
    } catch (error) {
      this.logger.error(`Failed to send message notifications: ${error.message}`);
    }
  }
}
