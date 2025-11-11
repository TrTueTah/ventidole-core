import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';

interface AuthSocket extends Socket {
  userId?: string;
  channels?: Set<string>;
}

@WebSocketGateway({
  cors: {
    origin: '*', // Configure this based on your frontend domain
    credentials: true,
  },
  namespace: '/chat',
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private connectedUsers: Map<string, string[]> = new Map(); // userId -> socketIds[]

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Handle client connection
   */
  async handleConnection(client: AuthSocket) {
    try {
      // Extract token from handshake auth or query
      const token = client.handshake.auth?.token || client.handshake.query?.token;

      if (!token) {
        this.logger.warn(`Connection rejected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify JWT token
      const payload = await this.jwtService.verifyAsync(token as string);
      const userId = payload.sub || payload.id;

      if (!userId) {
        this.logger.warn(`Connection rejected: Invalid token`);
        client.disconnect();
        return;
      }

      // Store user info in socket
      client.userId = userId;
      client.channels = new Set<string>();

      // Track connected sockets for this user
      const userSockets = this.connectedUsers.get(userId) || [];
      userSockets.push(client.id);
      this.connectedUsers.set(userId, userSockets);

      // Update user online status
      await this.prisma.user.update({
        where: { id: userId },
        data: { isOnline: true },
      });

      // Auto-join user's channels
      await this.joinUserChannels(client, userId);

      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
      
      // Notify user's contacts that they are online
      this.broadcastUserStatus(userId, true);

    } catch (error) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  /**
   * Handle client disconnection
   */
  async handleDisconnect(client: AuthSocket) {
    const userId = client.userId;

    if (userId) {
      // Remove this socket from user's socket list
      const userSockets = this.connectedUsers.get(userId) || [];
      const updatedSockets = userSockets.filter(id => id !== client.id);

      if (updatedSockets.length === 0) {
        // User has no more active connections
        this.connectedUsers.delete(userId);

        // Update user offline status
        await this.prisma.user.update({
          where: { id: userId },
          data: { isOnline: false },
        });

        // Notify user's contacts that they are offline
        this.broadcastUserStatus(userId, false);
      } else {
        this.connectedUsers.set(userId, updatedSockets);
      }

      this.logger.log(`Client disconnected: ${client.id} (User: ${userId})`);
    }
  }

  /**
   * Join a specific channel
   */
  @SubscribeMessage('join_channel')
  async handleJoinChannel(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { channelId: string },
  ) {
    const { channelId } = data;
    const userId = client.userId;

    if (!userId) {
      return { error: 'Unauthorized' };
    }

    try {
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
        return { error: 'Not a participant of this channel' };
      }

      // Join the Socket.IO room
      client.join(channelId);
      client.channels?.add(channelId);

      this.logger.log(`User ${userId} joined channel: ${channelId}`);
      return { success: true, channelId };
    } catch (error) {
      this.logger.error(`Error joining channel: ${error.message}`);
      return { error: 'Failed to join channel' };
    }
  }

  /**
   * Leave a specific channel
   */
  @SubscribeMessage('leave_channel')
  async handleLeaveChannel(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { channelId: string },
  ) {
    const { channelId } = data;

    client.leave(channelId);
    client.channels?.delete(channelId);

    this.logger.log(`User ${client.userId} left channel: ${channelId}`);
    return { success: true, channelId };
  }

  /**
   * User is typing in a channel
   */
  @SubscribeMessage('typing_start')
  handleTypingStart(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { channelId: string; userName: string },
  ) {
    const { channelId, userName } = data;
    
    // Broadcast to other users in the channel
    client.to(channelId).emit('user_typing', {
      channelId,
      userId: client.userId,
      userName,
      isTyping: true,
    });
  }

  /**
   * User stopped typing in a channel
   */
  @SubscribeMessage('typing_stop')
  handleTypingStop(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { channelId: string },
  ) {
    const { channelId } = data;
    
    client.to(channelId).emit('user_typing', {
      channelId,
      userId: client.userId,
      isTyping: false,
    });
  }

  /**
   * Mark message as read
   */
  @SubscribeMessage('message_read')
  async handleMessageRead(
    @ConnectedSocket() client: AuthSocket,
    @MessageBody() data: { channelId: string; messageId: string },
  ) {
    const { channelId, messageId } = data;
    
    // Broadcast read receipt to channel
    this.server.to(channelId).emit('message_read_receipt', {
      channelId,
      messageId,
      userId: client.userId,
      readAt: new Date(),
    });
  }

  /**
   * Broadcast new message to channel participants
   */
  emitNewMessage(channelId: string, message: any) {
    this.server.to(channelId).emit('new_message', message);
    this.logger.log(`Broadcasted new message to channel: ${channelId}`);
  }

  /**
   * Broadcast message update to channel participants
   */
  emitMessageUpdate(channelId: string, message: any) {
    this.server.to(channelId).emit('message_updated', message);
  }

  /**
   * Broadcast message deletion to channel participants
   */
  emitMessageDeleted(channelId: string, messageId: string) {
    this.server.to(channelId).emit('message_deleted', { channelId, messageId });
  }

  /**
   * Notify user about new channel
   */
  emitNewChannel(userId: string, channel: any) {
    const userSockets = this.connectedUsers.get(userId) || [];
    userSockets.forEach(socketId => {
      this.server.to(socketId).emit('new_channel', channel);
    });
  }

  /**
   * Auto-join user to all their channels on connection
   */
  private async joinUserChannels(client: AuthSocket, userId: string) {
    try {
      const participants = await this.prisma.chatParticipant.findMany({
        where: {
          userId,
          isActive: true,
        },
        select: {
          channelId: true,
        },
      });

      participants.forEach(p => {
        client.join(p.channelId);
        client.channels?.add(p.channelId);
      });

      this.logger.log(`User ${userId} auto-joined ${participants.length} channels`);
    } catch (error) {
      this.logger.error(`Error auto-joining channels: ${error.message}`);
    }
  }

  /**
   * Broadcast user online/offline status to their contacts
   */
  private async broadcastUserStatus(userId: string, isOnline: boolean) {
    try {
      // Get all channels where this user is a participant
      const participants = await this.prisma.chatParticipant.findMany({
        where: { userId },
        select: { channelId: true },
      });

      // Broadcast status to all these channels
      participants.forEach(p => {
        this.server.to(p.channelId).emit('user_status_changed', {
          userId,
          isOnline,
          timestamp: new Date(),
        });
      });
    } catch (error) {
      this.logger.error(`Error broadcasting user status: ${error.message}`);
    }
  }

  /**
   * Check if user is currently online
   */
  isUserOnline(userId: string): boolean {
    return this.connectedUsers.has(userId);
  }

  /**
   * Get count of active connections for a user
   */
  getUserConnectionCount(userId: string): number {
    return this.connectedUsers.get(userId)?.length || 0;
  }
}
