import getKnockClient from '@core/config/knock.config';
import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { KnockWorkflow } from '@shared/enum/knock-workflow.enum';
import { CustomError } from '@shared/helper/error';
import { GetStreamNotificationService } from '@shared/service/getstream-notification/getstream-notification.service';

export interface WorkflowActor {
  id: string;
  name?: string;
  avatar?: string;
}

export interface NotificationMetadata {
  url?: string;
  type?: string;
  [key: string]: any;
}

@Injectable()
export class KnockWorkflowService {
  private readonly logger = new Logger(KnockWorkflowService.name);

  constructor(
    private readonly getStreamNotificationService: GetStreamNotificationService,
  ) {}

  /**
   * Trigger a custom workflow
   */
  async triggerWorkflow(
    workflowKey: string,
    recipients:
      | string[]
      | Array<{ id: string; name?: string; email?: string; avatar?: string }>,
    data: Record<string, any>,
    actor?: WorkflowActor,
  ): Promise<string> {
    try {
      const knockClient = getKnockClient();

      const payload = {
        recipients,
        data,
        actor: actor || { id: 'system', name: 'System' },
      };

      const response = await knockClient.workflows.trigger(
        workflowKey,
        payload,
      );

      const recipientCount = Array.isArray(recipients) ? recipients.length : 0;
      this.logger.log(
        `Triggered workflow ${workflowKey} for ${recipientCount} users`,
      );

      return response.workflow_run_id;
    } catch (error) {
      this.logger.error(
        `Error triggering workflow ${workflowKey}:`,
        error.message,
      );
      throw new CustomError(ErrorCode.KnockWorkflowTriggerFailed);
    }
  }

  /**
   * Notify community members about a new post
   */
  async notifyCommunityNewPost(params: {
    members: Array<{
      id: string;
      name?: string;
      email?: string;
      avatar?: string;
    }>;
    communityId: string;
    communityName: string;
    postId: string;
    postTitle: string;
    author: WorkflowActor;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    if (params.members.length === 0) {
      this.logger.log('No community members to notify');
      return '';
    }

    // Send real-time notification via GetStream
    await this.getStreamNotificationService.emitNewPostEvent({
      userIds: params.members.map((m) => m.id),
      postId: params.postId,
      authorName: params.author.name || 'Someone',
      communityName: params.communityName,
      postPreview: params.postTitle,
    });

    return this.triggerWorkflow(
      KnockWorkflow.COMMUNITY_NEW_POST,
      params.members,
      {
        type: 'community-new-post',
        communityId: params.communityId,
        communityName: params.communityName,
        postId: params.postId,
        postTitle: params.postTitle,
        authorName: params.author.name,
        authorAvatar: params.author.avatar,
        url:
          params.metadata?.url ||
          `/communities/${params.communityId}/posts/${params.postId}`,
        ...params.metadata,
      },
      params.author,
    );
  }

  /**
   * Notify idol when someone joins their community
   */
  async notifyCommunityJoined(params: {
    idolId: string;
    fanId: string;
    fanName: string;
    communityId: string;
    communityName: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    // Send real-time notification via GetStream
    await this.getStreamNotificationService.emitCommunityJoinedEvent({
      idolId: params.idolId,
      fanName: params.fanName,
      communityId: params.communityId,
      communityName: params.communityName,
    });

    return this.triggerWorkflow(
      KnockWorkflow.COMMUNITY_JOINED,
      [params.idolId],
      {
        type: 'community-joined',
        fanId: params.fanId,
        fanName: params.fanName,
        communityId: params.communityId,
        communityName: params.communityName,
        url:
          params.metadata?.url ||
          `/communities/${params.communityId}/followers`,
        ...params.metadata,
      },
      { id: params.fanId, name: params.fanName },
    );
  }

  /**
   * Notify user when order is confirmed
   */
  async notifyConfirmOrder(params: {
    userId: string;
    orderId: string;
    orderCode: string;
    title: string;
    text: string;
    metadata?: NotificationMetadata;
    actor?: WorkflowActor;
  }): Promise<string> {
    // Send real-time notification via GetStream
    await this.getStreamNotificationService.emitOrderStatusEvent({
      userId: params.userId,
      orderId: params.orderId,
      orderCode: params.orderCode,
      status: 'confirmed',
    });

    return this.triggerWorkflow(
      KnockWorkflow.CONFIRM_ORDER,
      [params.userId],
      {
        type: 'confirm-order',
        orderId: params.orderId,
        orderCode: params.orderCode,
        title: params.title,
        text: params.text,
        url: params.metadata?.url || `/orders/${params.orderId}`,
        ...params.metadata,
      },
      params.actor || { id: 'system', name: 'System' },
    );
  }

  /**
   * Notify user when someone likes their post
   */
  async notifyPostLiked(params: {
    authorId: string;
    liker: WorkflowActor;
    postId: string;
    postContent: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    // Send real-time notification via GetStream
    await this.getStreamNotificationService.emitPostLikedEvent({
      userId: params.authorId,
      likerName: params.liker.name || 'Someone',
      postId: params.postId,
    });

    return this.triggerWorkflow(
      KnockWorkflow.POST_LIKED,
      [params.authorId],
      {
        type: 'post-liked',
        likerId: params.liker.id,
        likerName: params.liker.name,
        likerAvatar: params.liker.avatar,
        postId: params.postId,
        postContent: params.postContent.substring(0, 100),
        url: params.metadata?.url || `/posts/${params.postId}`,
        ...params.metadata,
      },
      params.liker,
    );
  }

  /**
   * Notify user when someone comments on their post
   */
  async notifyPostCommented(params: {
    authorId: string;
    commenter: WorkflowActor;
    postId: string;
    postContent: string;
    commentContent: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    // Send real-time notification via GetStream
    await this.getStreamNotificationService.emitPostCommentedEvent({
      userId: params.authorId,
      commenterName: params.commenter.name || 'Someone',
      postId: params.postId,
      commentPreview: params.commentContent.substring(0, 100),
    });

    return this.triggerWorkflow(
      KnockWorkflow.POST_COMMENTED,
      [params.authorId],
      {
        type: 'post-commented',
        commenterId: params.commenter.id,
        commenterName: params.commenter.name,
        commenterAvatar: params.commenter.avatar,
        postId: params.postId,
        postContent: params.postContent.substring(0, 100),
        commentContent: params.commentContent.substring(0, 100),
        url: params.metadata?.url || `/posts/${params.postId}`,
        ...params.metadata,
      },
      params.commenter,
    );
  }

  /**
   * Notify community members when a new channel is created
   */
  async notifyChannelCreated(params: {
    recipientIds: string[];
    channelId: string;
    channelName: string;
    creatorName: string;
    communityName?: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    if (params.recipientIds.length === 0) {
      this.logger.log('No recipients to notify about channel creation');
      return '';
    }

    // Send real-time notification via GetStream
    await this.getStreamNotificationService.emitChannelCreatedEvent({
      userIds: params.recipientIds,
      channelId: params.channelId,
      channelName: params.channelName,
      creatorName: params.creatorName,
      communityName: params.communityName,
    });

    return this.triggerWorkflow(
      KnockWorkflow.CHANNEL_CREATED,
      params.recipientIds,
      {
        type: 'channel-created',
        creatorName: params.creatorName,
        channelId: params.channelId,
        channelName: params.channelName,
        communityName: params.communityName,
        url: params.metadata?.url || `/chat/${params.channelId}`,
        ...params.metadata,
      },
      { id: 'system', name: params.creatorName },
    );
  }

  /**
   * Notify user when order is shipped
   */
  async notifyOrderShipped(params: {
    userId: string;
    orderId: string;
    orderCode: string;
    trackingNumber?: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    // Send real-time notification via GetStream
    await this.getStreamNotificationService.emitOrderStatusEvent({
      userId: params.userId,
      orderId: params.orderId,
      orderCode: params.orderCode,
      status: 'shipped',
      trackingNumber: params.trackingNumber,
    });

    return this.triggerWorkflow(
      KnockWorkflow.ORDER_SHIPPED,
      [params.userId],
      {
        type: 'order-shipped',
        orderId: params.orderId,
        orderCode: params.orderCode,
        trackingNumber: params.trackingNumber,
        url: params.metadata?.url || `/orders/${params.orderId}`,
        ...params.metadata,
      },
      { id: 'system', name: 'Ventidole' },
    );
  }

  /**
   * Notify user when order is delivered
   */
  async notifyOrderDelivered(params: {
    userId: string;
    orderId: string;
    orderCode: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    // Send real-time notification via GetStream
    await this.getStreamNotificationService.emitOrderStatusEvent({
      userId: params.userId,
      orderId: params.orderId,
      orderCode: params.orderCode,
      status: 'delivered',
    });

    return this.triggerWorkflow(
      KnockWorkflow.ORDER_DELIVERED,
      [params.userId],
      {
        type: 'order-delivered',
        orderId: params.orderId,
        orderCode: params.orderCode,
        url: params.metadata?.url || `/orders/${params.orderId}`,
        ...params.metadata,
      },
      { id: 'system', name: 'Ventidole' },
    );
  }

  /**
   * Notify all users about a new banner/announcement
   */
  async notifyBannerCreated(params: {
    userIds: string[];
    bannerId: string;
    title: string;
    description?: string;
    imageUrl?: string;
    actionUrl?: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    if (params.userIds.length === 0) {
      this.logger.log('No users to notify about banner');
      return '';
    }

    // Send real-time notification via GetStream
    await this.getStreamNotificationService.emitBannerCreatedEvent({
      userIds: params.userIds,
      bannerId: params.bannerId,
      title: params.title,
      imageUrl: params.imageUrl,
      actionUrl: params.actionUrl,
    });

    return this.triggerWorkflow(
      KnockWorkflow.BANNER_CREATED,
      params.userIds,
      {
        type: 'banner-created',
        bannerId: params.bannerId,
        title: params.title,
        description: params.description,
        imageUrl: params.imageUrl,
        actionUrl: params.actionUrl,
        url: params.metadata?.url || params.actionUrl || '/banners',
        ...params.metadata,
      },
      { id: 'system', name: 'Ventidole' },
    );
  }
}
