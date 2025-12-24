import getKnockClient from '@core/config/knock.config';
import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { KnockWorkflow } from '@shared/enum/knock-workflow.enum';
import { CustomError } from '@shared/helper/error';

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

    return this.triggerWorkflow(
      KnockWorkflow.COMMUNITY_NEW_POST,
      params.members,
      {
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

  async notifyConfirmOrder(params: {
    userId: string;
    title: string;
    text: string;
    metadata?: NotificationMetadata;
    actor?: WorkflowActor;
  }): Promise<string> {
    return this.triggerWorkflow(
      KnockWorkflow.CONFIRM_ORDER,
      [params.userId],
      {
        title: params.title,
        text: params.text,
        url: params.metadata?.url || '/notifications',
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
    return this.triggerWorkflow(
      KnockWorkflow.POST_LIKED,
      [params.authorId],
      {
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
    return this.triggerWorkflow(
      KnockWorkflow.POST_COMMENTED,
      [params.authorId],
      {
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
   * Notify idol when someone joins their community
   */
  async notifyCommunityJoined(params: {
    idolId: string;
    fan: WorkflowActor;
    communityId: string;
    communityName: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      KnockWorkflow.COMMUNITY_JOINED,
      [params.idolId],
      {
        fanName: params.fan.name,
        fanAvatar: params.fan.avatar,
        communityId: params.communityId,
        communityName: params.communityName,
        url:
          params.metadata?.url ||
          `/communities/${params.communityId}/followers`,
        ...params.metadata,
      },
      params.fan,
    );
  }

  /**
   * Notify user of new chat message
   */
  async notifyNewMessage(params: {
    recipientId: string;
    sender: WorkflowActor;
    channelId: string;
    channelName: string;
    messagePreview: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      KnockWorkflow.NEW_MESSAGE,
      [params.recipientId],
      {
        senderName: params.sender.name,
        senderAvatar: params.sender.avatar,
        channelId: params.channelId,
        channelName: params.channelName,
        messagePreview: params.messagePreview.substring(0, 100),
        url: params.metadata?.url || `/chat/${params.channelId}`,
        ...params.metadata,
      },
      params.sender,
    );
  }

  /**
   * Notify user when added to a channel
   */
  async notifyChannelInvitation(params: {
    recipientId: string;
    inviter: WorkflowActor;
    channelId: string;
    channelName: string;
    channelDescription?: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      KnockWorkflow.CHANNEL_INVITATION,
      [params.recipientId],
      {
        inviterName: params.inviter.name,
        inviterAvatar: params.inviter.avatar,
        channelId: params.channelId,
        channelName: params.channelName,
        channelDescription: params.channelDescription,
        url: params.metadata?.url || `/chat/${params.channelId}`,
        ...params.metadata,
      },
      params.inviter,
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

    return this.triggerWorkflow(
      KnockWorkflow.CHANNEL_CREATED,
      params.recipientIds,
      {
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
    return this.triggerWorkflow(
      KnockWorkflow.ORDER_SHIPPED,
      [params.userId],
      {
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
    return this.triggerWorkflow(
      KnockWorkflow.ORDER_DELIVERED,
      [params.userId],
      {
        orderId: params.orderId,
        orderCode: params.orderCode,
        url: params.metadata?.url || `/orders/${params.orderId}`,
        ...params.metadata,
      },
      { id: 'system', name: 'Ventidole' },
    );
  }

  /**
   * Notify user of successful payment
   */
  async notifyPaymentSuccess(params: {
    userId: string;
    orderId: string;
    orderCode: string;
    amount: number;
    paymentMethod: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      KnockWorkflow.PAYMENT_SUCCESS,
      [params.userId],
      {
        orderId: params.orderId,
        orderCode: params.orderCode,
        amount: params.amount,
        paymentMethod: params.paymentMethod,
        url: params.metadata?.url || `/orders/${params.orderId}`,
        ...params.metadata,
      },
      { id: 'system', name: 'Ventidole' },
    );
  }

  /**
   * Notify user of failed payment
   */
  async notifyPaymentFailed(params: {
    userId: string;
    orderId: string;
    orderCode: string;
    amount: number;
    reason?: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      KnockWorkflow.PAYMENT_FAILED,
      [params.userId],
      {
        orderId: params.orderId,
        orderCode: params.orderCode,
        amount: params.amount,
        failureReason: params.reason || 'Payment processing failed',
        url: params.metadata?.url || `/orders/${params.orderId}`,
        ...params.metadata,
      },
      { id: 'system', name: 'Ventidole' },
    );
  }
}
