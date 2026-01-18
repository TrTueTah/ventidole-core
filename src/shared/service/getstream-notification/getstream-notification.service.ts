import getStreamChatClient from '@core/config/stream-chat.config';
import { Injectable, Logger } from '@nestjs/common';

export interface NotificationEventData {
  type: string;
  title?: string;
  message?: string;
  url?: string;
  data?: Record<string, any>;
  [key: string]: any;
}

@Injectable()
export class GetStreamNotificationService {
  private readonly logger = new Logger(GetStreamNotificationService.name);

  /**
   * Get notification channel ID for a user
   */
  private getNotificationChannelId(userId: string): string {
    return `notifications-${userId}`;
  }

  /**
   * Create notification channel for a user
   * This channel is used to send real-time app events to the user
   */
  async createNotificationChannel(userId: string): Promise<void> {
    try {
      const streamChatClient = getStreamChatClient();
      const channelId = this.getNotificationChannelId(userId);

      const channel = streamChatClient.channel('team', channelId, {
        name: 'Notifications',
        created_by_id: 'system',
        members: [userId],
      });

      await channel.create();

      this.logger.log(
        `Created notification channel for user ${userId}: ${channelId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create notification channel for user ${userId}:`,
        error.message,
      );
      // Don't throw - notification channel creation failure shouldn't block user creation
    }
  }

  /**
   * Emit an event to user's notification channel
   * This sends real-time events that the frontend can listen to
   */
  async emitEventToUser(
    userId: string,
    eventType: string,
    data: NotificationEventData,
  ): Promise<void> {
    try {
      const streamChatClient = getStreamChatClient();
      const channelId = this.getNotificationChannelId(userId);

      const channel = streamChatClient.channel('team', channelId);

      // Send as a message to the notifications channel
      await channel.sendMessage({
        text: data.message || eventType,
        user_id: 'system',
        type: eventType,
        ...data,
      });

      this.logger.log(
        `Emitted event ${eventType} to user ${userId}'s notification channel`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to emit event ${eventType} to user ${userId}:`,
        error.message,
      );
      // Don't throw - event emission failure shouldn't break main flow
    }
  }

  /**
   * Emit event to multiple users
   */
  async emitEventToUsers(
    userIds: string[],
    eventType: string,
    data: NotificationEventData,
  ): Promise<void> {
    await Promise.all(
      userIds.map((userId) => this.emitEventToUser(userId, eventType, data)),
    );
  }

  // ==================== Specific Event Emitters ====================

  /**
   * Notify user about new post in a community they follow
   */
  async emitNewPostEvent(params: {
    userIds: string[];
    postId: string;
    authorName: string;
    communityName: string;
    postPreview: string;
  }): Promise<void> {
    await this.emitEventToUsers(params.userIds, 'new_post', {
      type: 'new_post',
      title: `New post from ${params.authorName}`,
      message: `${params.authorName} posted in ${params.communityName}`,
      url: `/posts/${params.postId}`,
      data: {
        postId: params.postId,
        authorName: params.authorName,
        communityName: params.communityName,
        preview: params.postPreview,
      },
    });
  }

  /**
   * Notify user about someone liking their post
   */
  async emitPostLikedEvent(params: {
    userId: string;
    likerName: string;
    postId: string;
  }): Promise<void> {
    await this.emitEventToUser(params.userId, 'post_liked', {
      type: 'post_liked',
      title: 'Someone liked your post',
      message: `${params.likerName} liked your post`,
      url: `/posts/${params.postId}`,
      data: {
        postId: params.postId,
        likerName: params.likerName,
      },
    });
  }

  /**
   * Notify user about new comment on their post
   */
  async emitPostCommentedEvent(params: {
    userId: string;
    commenterName: string;
    postId: string;
    commentPreview: string;
  }): Promise<void> {
    await this.emitEventToUser(params.userId, 'post_commented', {
      type: 'post_commented',
      title: 'New comment on your post',
      message: `${params.commenterName} commented on your post`,
      url: `/posts/${params.postId}`,
      data: {
        postId: params.postId,
        commenterName: params.commenterName,
        commentPreview: params.commentPreview,
      },
    });
  }

  /**
   * Notify idol about new follower in their community
   */
  async emitCommunityJoinedEvent(params: {
    idolId: string;
    fanName: string;
    communityId: string;
    communityName: string;
  }): Promise<void> {
    await this.emitEventToUser(params.idolId, 'community_joined', {
      type: 'community_joined',
      title: 'New community member',
      message: `${params.fanName} joined ${params.communityName}`,
      url: `/communities/${params.communityId}/followers`,
      data: {
        fanName: params.fanName,
        communityId: params.communityId,
        communityName: params.communityName,
      },
    });
  }

  /**
   * Notify user about new message (for users not actively in the chat)
   */
  async emitNewMessageEvent(params: {
    userId: string;
    senderName: string;
    channelId: string;
    messagePreview: string;
  }): Promise<void> {
    await this.emitEventToUser(params.userId, 'new_message', {
      type: 'new_message',
      title: `Message from ${params.senderName}`,
      message: params.messagePreview,
      url: `/chat/${params.channelId}`,
      data: {
        channelId: params.channelId,
        senderName: params.senderName,
        preview: params.messagePreview,
      },
    });
  }

  /**
   * Notify users about a new channel being created
   */
  async emitChannelCreatedEvent(params: {
    userIds: string[];
    channelId: string;
    channelName: string;
    creatorName: string;
    communityName?: string;
  }): Promise<void> {
    await this.emitEventToUsers(params.userIds, 'channel_created', {
      type: 'channel_created',
      title: 'New channel created',
      message: `${params.creatorName} created ${params.channelName}${params.communityName ? ` in ${params.communityName}` : ''}`,
      url: `/chat/${params.channelId}`,
      data: {
        channelId: params.channelId,
        channelName: params.channelName,
        creatorName: params.creatorName,
        communityName: params.communityName,
      },
    });
  }

  /**
   * Notify user about order status changes
   */
  async emitOrderStatusEvent(params: {
    userId: string;
    orderId: string;
    orderCode: string;
    status: 'paid' | 'confirmed' | 'shipped' | 'delivered';
    trackingNumber?: string;
  }): Promise<void> {
    const statusMessages = {
      paid: 'Your payment has been confirmed',
      confirmed: 'Your order has been confirmed',
      shipped: 'Your order has been shipped',
      delivered: 'Your order has been delivered',
    };

    await this.emitEventToUser(params.userId, 'order_status_updated', {
      type: 'order_status_updated',
      title: 'Order Update',
      message: statusMessages[params.status],
      url: `/orders/${params.orderId}`,
      data: {
        orderId: params.orderId,
        orderCode: params.orderCode,
        status: params.status,
        trackingNumber: params.trackingNumber,
      },
    });
  }

  /**
   * Notify user to invalidate queries (trigger refetch)
   */
  async emitInvalidateQueriesEvent(params: {
    userId: string;
    queryKeys: string[];
  }): Promise<void> {
    await this.emitEventToUser(params.userId, 'invalidate_queries', {
      type: 'invalidate_queries',
      data: {
        queryKeys: params.queryKeys,
      },
    });
  }

  /**
   * Trigger navigation on user's device
   */
  async emitNavigationEvent(params: {
    userId: string;
    screen: string;
    params?: Record<string, any>;
  }): Promise<void> {
    await this.emitEventToUser(params.userId, 'navigate', {
      type: 'navigate',
      data: {
        screen: params.screen,
        params: params.params,
      },
    });
  }

  /**
   * Notify all users about a new banner
   */
  async emitBannerCreatedEvent(params: {
    userIds: string[];
    bannerId: string;
    title: string;
    imageUrl?: string;
    actionUrl?: string;
  }): Promise<void> {
    await this.emitEventToUsers(params.userIds, 'banner_created', {
      type: 'banner_created',
      title: 'New Announcement',
      message: params.title,
      url: params.actionUrl || '/banners',
      data: {
        bannerId: params.bannerId,
        title: params.title,
        imageUrl: params.imageUrl,
        actionUrl: params.actionUrl,
      },
    });
  }
}
