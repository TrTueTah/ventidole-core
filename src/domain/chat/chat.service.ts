import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { FirebaseService } from '@shared/service/firebase/firebase.service';
import { NotificationService } from '@shared/service/notification/notification.service';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { ChatChannelType, ChatRole } from 'src/db/prisma/enums';
import { CreateChannelRequest } from './request/create-channel.request';
import { SendMessageRequest } from './request/send-message.request';
import { AddParticipantsRequest } from './request/add-participants.request';
import { MarkAsReadRequest } from './request/mark-as-read.request';
import { ChatMessage } from './interface/chat.interface';
import { getCollection } from 'src/db/firebase/get-collection';
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
  async createChannel(body: CreateChannelRequest, request: IRequest) {
    // Validate request.user exists
    console.log('Request User:', request.user);
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

    // For announcement channels, verify user is an idol
    if (body.isAnnouncement) {
      const idol = await this.prisma.idol.findUnique({
        where: { userId },
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
  async getMyChannels(request: IRequest) {
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
   * Get channel by ID
   */
  async getChannelById(channelId: string, request: IRequest) {
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
  async sendMessage(body: SendMessageRequest, request: IRequest) {
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
   * Get messages from a channel
   */
  async getMessages(channelId: string, limit: number = 50, lastMessageId?: string, request?: IRequest) {
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

    const firestore = this.firebaseService.getFirestore();
    let query = firestore
      .collection(this.collections.chatMessages)
      .where('channelId', '==', channelId)
      .orderBy('createdAt', 'desc')
      .limit(limit);

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
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
    }));

    return BaseResponse.of(messages);
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
  async addParticipants(body: AddParticipantsRequest, request: IRequest) {
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
