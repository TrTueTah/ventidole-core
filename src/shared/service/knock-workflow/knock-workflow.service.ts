import getKnockClient from '@core/config/knock.config';
import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '@shared/enum/error-code.enum';
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
   * Notify user about a new follower
   */
  async notifyNewFollower(params: {
    userId: string;
    follower: WorkflowActor;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      'new-follower',
      [params.userId],
      {
        followerName: params.follower.name,
        followerAvatar: params.follower.avatar,
        url: params.metadata?.url || `/profile/${params.follower.id}`,
        ...params.metadata,
      },
      params.follower,
    );
  }

  /**
   * Notify user about a post like
   */
  async notifyPostLiked(params: {
    postAuthorId: string;
    postId: string;
    postTitle?: string;
    liker: WorkflowActor;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      'post-liked',
      [params.postAuthorId],
      {
        postId: params.postId,
        postTitle: params.postTitle || 'your post',
        likerName: params.liker.name,
        likerAvatar: params.liker.avatar,
        url: params.metadata?.url || `/posts/${params.postId}`,
        ...params.metadata,
      },
      params.liker,
    );
  }

  /**
   * Notify user about a new comment on their post
   */
  async notifyNewComment(params: {
    postAuthorId: string;
    postId: string;
    postTitle?: string;
    commentId: string;
    commentText: string;
    commenter: WorkflowActor;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      'new-comment',
      [params.postAuthorId],
      {
        postId: params.postId,
        postTitle: params.postTitle || 'your post',
        commentId: params.commentId,
        commentText: params.commentText,
        commenterName: params.commenter.name,
        commenterAvatar: params.commenter.avatar,
        url:
          params.metadata?.url || `/posts/${params.postId}#${params.commentId}`,
        ...params.metadata,
      },
      params.commenter,
    );
  }

  /**
   * Notify user about a reply to their comment
   */
  async notifyCommentReply(params: {
    originalCommenterId: string;
    postId: string;
    commentId: string;
    replyText: string;
    replier: WorkflowActor;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      'comment-reply',
      [params.originalCommenterId],
      {
        postId: params.postId,
        commentId: params.commentId,
        replyText: params.replyText,
        replierName: params.replier.name,
        replierAvatar: params.replier.avatar,
        url:
          params.metadata?.url || `/posts/${params.postId}#${params.commentId}`,
        ...params.metadata,
      },
      params.replier,
    );
  }

  /**
   * Notify user when they are mentioned
   */
  async notifyUserMention(params: {
    mentionedUserId: string;
    postId?: string;
    commentId?: string;
    text: string;
    mentioner: WorkflowActor;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    const url = params.postId
      ? `/posts/${params.postId}${params.commentId ? '#' + params.commentId : ''}`
      : params.metadata?.url || '/';

    return this.triggerWorkflow(
      'user-mention',
      [params.mentionedUserId],
      {
        postId: params.postId,
        commentId: params.commentId,
        text: params.text,
        mentionerName: params.mentioner.name,
        mentionerAvatar: params.mentioner.avatar,
        url,
        ...params.metadata,
      },
      params.mentioner,
    );
  }

  /**
   * Notify followers about a new post
   */
  async notifyNewPost(params: {
    followerIds: string[];
    postId: string;
    postTitle: string;
    postExcerpt?: string;
    author: WorkflowActor;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    if (params.followerIds.length === 0) {
      this.logger.log('No followers to notify for new post');
      return '';
    }

    return this.triggerWorkflow(
      'new-post',
      params.followerIds,
      {
        postId: params.postId,
        postTitle: params.postTitle,
        postExcerpt: params.postExcerpt,
        authorName: params.author.name,
        authorAvatar: params.author.avatar,
        url: params.metadata?.url || `/posts/${params.postId}`,
        ...params.metadata,
      },
      params.author,
    );
  }

  /**
   * Notify user for an in-app notification
   */

  async notifyInAppNotification(params: {
    userId: string;
    title: string;
    text: string;
    metadata?: NotificationMetadata;
    actor?: WorkflowActor;
  }): Promise<string> {
    return this.triggerWorkflow(
      'in-app-notification',
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
   * Notify user about community invitation
   */
  async notifyCommunityInvite(params: {
    userId: string;
    communityId: string;
    communityName: string;
    inviter: WorkflowActor;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      'community-invite',
      [params.userId],
      {
        communityId: params.communityId,
        communityName: params.communityName,
        inviterName: params.inviter.name,
        inviterAvatar: params.inviter.avatar,
        url: params.metadata?.url || `/communities/${params.communityId}`,
        ...params.metadata,
      },
      params.inviter,
    );
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
      'community-new-post',
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

  /**
   * Send welcome notification to new user
   */
  async notifyWelcome(params: {
    userId: string;
    userName: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      'welcome',
      [params.userId],
      {
        userName: params.userName,
        url: params.metadata?.url || '/getting-started',
        ...params.metadata,
      },
      { id: 'system', name: 'Ventidole' },
    );
  }

  /**
   * Notify user about password change (security notification)
   */
  async notifyPasswordChanged(params: {
    userId: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      'password-changed',
      [params.userId],
      {
        timestamp: new Date().toISOString(),
        url: params.metadata?.url || '/settings/security',
        ...params.metadata,
      },
      { id: 'system', name: 'Security' },
    );
  }

  /**
   * Notify user about new device login (security alert)
   */
  async notifyNewDeviceLogin(params: {
    userId: string;
    deviceInfo: {
      device?: string;
      location?: string;
      ip?: string;
    };
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      'new-device-login',
      [params.userId],
      {
        device: params.deviceInfo.device,
        location: params.deviceInfo.location,
        ip: params.deviceInfo.ip,
        timestamp: new Date().toISOString(),
        url: params.metadata?.url || '/settings/security',
        ...params.metadata,
      },
      { id: 'system', name: 'Security' },
    );
  }

  /**
   * Notify moderators about reported content
   */
  async notifyContentReported(params: {
    moderatorIds: string[];
    contentType: 'post' | 'comment' | 'user';
    contentId: string;
    reportReason: string;
    reporter: WorkflowActor;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    if (params.moderatorIds.length === 0) {
      this.logger.log('No moderators to notify');
      return '';
    }

    return this.triggerWorkflow(
      'content-reported',
      params.moderatorIds,
      {
        contentType: params.contentType,
        contentId: params.contentId,
        reportReason: params.reportReason,
        reporterName: params.reporter.name,
        url:
          params.metadata?.url ||
          `/moderation/${params.contentType}/${params.contentId}`,
        ...params.metadata,
      },
      params.reporter,
    );
  }

  /**
   * Notify user about account action (ban, warning, etc.)
   */
  async notifyAccountAction(params: {
    userId: string;
    action: 'banned' | 'warned' | 'unbanned';
    reason?: string;
    duration?: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      'account-action',
      [params.userId],
      {
        action: params.action,
        reason: params.reason,
        duration: params.duration,
        url: params.metadata?.url || '/support',
        ...params.metadata,
      },
      { id: 'system', name: 'Moderation' },
    );
  }

  /**
   * Notify user about content removal
   */
  async notifyContentRemoved(params: {
    userId: string;
    contentType: 'post' | 'comment';
    contentTitle?: string;
    reason: string;
    metadata?: NotificationMetadata;
  }): Promise<string> {
    return this.triggerWorkflow(
      'content-removed',
      [params.userId],
      {
        contentType: params.contentType,
        contentTitle: params.contentTitle,
        reason: params.reason,
        url: params.metadata?.url || '/guidelines',
        ...params.metadata,
      },
      { id: 'system', name: 'Moderation' },
    );
  }
}
