import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { MultiDatabaseService } from '@shared/service/multi-database/multi-database.service';

/**
 * Example controller demonstrating PostgreSQL + Firebase for mobile apps
 * 
 * Features:
 * - User registration with Firebase profiles
 * - Real-time chat with Firestore
 * - Online presence tracking
 * - Push notifications
 * - Health checks
 */
@ApiTags('Examples - Mobile App Database')
@Controller({ path: 'examples/databases', version: '1' })
export class ExampleDatabaseController {
  constructor(private multiDb: MultiDatabaseService) {}

  /**
   * Health Check
   * Verify PostgreSQL and Firebase connections
   */
  @Get('health')
  @ApiOperation({ summary: 'Health check for all databases' })
  @ApiResponse({ status: 200, description: 'Health status' })
  async healthCheck() {
    return await this.multiDb.healthCheck();
  }

  /**
   * Register User
   * - Create account in PostgreSQL
   * - Create Firebase profile for real-time features
   * - Store FCM token for push notifications
   */
  @Post('users/register')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered' })
  async registerUser(
    @Body() body: {
      email: string;
      name: string;
      password: string;
      fcmToken?: string;
    },
  ) {
    return await this.multiDb.registerUser(
      body.email,
      body.name,
      body.password,
      body.fcmToken,
    );
  }

  /**
   * Send Chat Message
   * - Store in Firebase Firestore for real-time sync
   * - Mobile apps get instant updates via listeners
   */
  @Post('chat/:roomId/messages')
  @ApiOperation({ summary: 'Send a chat message' })
  @ApiResponse({ status: 201, description: 'Message sent' })
  async sendMessage(
    @Param('roomId') roomId: string,
    @Body() body: {
      senderId: string;
      message: string;
    },
  ) {
    return await this.multiDb.sendChatMessage(
      roomId,
      body.senderId,
      body.message,
    );
  }

  /**
   * Get Chat Messages
   * - Fetch recent messages from Firestore
   * - Mobile apps use real-time listeners instead
   */
  @Get('chat/:roomId/messages')
  @ApiOperation({ summary: 'Get chat messages' })
  @ApiResponse({ status: 200, description: 'Messages retrieved' })
  async getMessages(
    @Param('roomId') roomId: string,
    @Query('limit') limit?: number,
  ) {
    return await this.multiDb.getChatMessages(
      roomId,
      limit ? parseInt(String(limit)) : 50,
    );
  }

  /**
   * Update User Presence
   * - Update online/offline status in Firestore
   * - Other users see status updates in real-time
   */
  @Post('users/:userId/presence')
  @ApiOperation({ summary: 'Update user presence' })
  @ApiResponse({ status: 200, description: 'Presence updated' })
  async updatePresence(
    @Param('userId') userId: string,
    @Body() body: { isOnline: boolean },
  ) {
    return await this.multiDb.updatePresence(userId, body.isOnline);
  }

  /**
   * Send Push Notification
   * - Send notification via Firebase Cloud Messaging
   * - Notifications appear on user's mobile device
   */
  @Post('users/:userId/notifications')
  @ApiOperation({ summary: 'Send push notification' })
  @ApiResponse({ status: 200, description: 'Notification sent' })
  async sendNotification(
    @Param('userId') userId: string,
    @Body() body: {
      title: string;
      body: string;
      data?: Record<string, string>;
    },
  ) {
    return await this.multiDb.sendPushNotification(
      userId,
      body.title,
      body.body,
      body.data,
    );
  }
}
