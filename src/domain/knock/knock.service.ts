import getKnockClient, {
  getKnockInAppWorkflowKey,
  getKnockPushChannelId,
  getKnockSigningKey,
} from '@core/config/knock.config';
import { signUserToken } from '@knocklabs/node';
import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { KnockWorkflowService } from '@shared/service/knock-workflow/knock-workflow.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { GenerateKnockTokenDto } from './dto/generate-token.dto';
import { RegisterFcmTokenResponseDto } from './dto/register-fcm-token.dto';
import { SendNotificationDto } from './dto/send-notification.dto';
import { WorkflowResponseDto } from './dto/workflow-response.dto';

@Injectable()
export class KnockService {
  private readonly logger = new Logger(KnockService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knockWorkflowService: KnockWorkflowService,
  ) {}

  /**
   * Register FCM token for push notifications
   */
  async registerFcmToken(
    userId: string,
    fcmToken: string,
  ): Promise<RegisterFcmTokenResponseDto> {
    try {
      this.logger.log(`Registering FCM token for user: ${userId}`);

      if (!fcmToken) {
        throw new CustomError(ErrorCode.InvalidFcmToken);
      }

      // Get push channel ID
      const pushChannelId = getKnockPushChannelId();
      if (!pushChannelId) {
        this.logger.error(
          'KNOCK_PUSH_CHANNEL_ID not configured in environment',
        );
        throw new CustomError(ErrorCode.KnockPushChannelNotConfigured);
      }

      const knockClient = getKnockClient();

      // Get user data from database
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          username: true,
          avatarUrl: true,
          role: true,
        },
      });

      if (!user) {
        throw new CustomError(ErrorCode.UserNotFound);
      }

      // Prepare user data for Knock
      const knockUserData = {
        name: user.username,
        email: user.email,
        avatar: user.avatarUrl,
        role: user.role,
      };

      this.logger.log(`Registering user in Knock before setting FCM token`);

      // First, ensure the user exists in Knock
      await knockClient.users.identify(userId, knockUserData);

      this.logger.log(
        `Setting FCM token for channel ${pushChannelId}, user ${userId}`,
      );

      // Set the FCM token in Knock's push channel
      await knockClient.users.setChannelData(userId, pushChannelId, {
        data: {
          tokens: [fcmToken],
        },
      });

      this.logger.log(`Successfully registered FCM token for user ${userId}`);

      return {
        success: true,
        message: 'FCM token registered successfully',
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error('Failed to register FCM token', {
        userId,
        error: errorMessage,
        errorStack: error instanceof Error ? error.stack : undefined,
      });

      // Re-throw CustomError as-is
      if (error instanceof CustomError) {
        throw error;
      }

      // Wrap other errors
      throw new CustomError(ErrorCode.KnockFcmTokenRegistrationFailed);
    }
  }

  /**
   * Generate authentication token for Knock client SDK
   */
  async generateToken(userId: string): Promise<GenerateKnockTokenDto> {
    try {
      const signingKey = getKnockSigningKey();

      const token = await signUserToken(userId, {
        signingKey,
      });

      this.logger.log(`Generated Knock token for user: ${userId}`);

      return {
        token,
        userId,
        expiresIn: 3600, // 1 hour
      };
    } catch (error) {
      this.logger.error(
        `Error generating Knock token for user ${userId}:`,
        error.message,
      );
      throw new CustomError(ErrorCode.KnockTokenGenerationFailed);
    }
  }

  /**
   * Send a generic in-app notification
   */
  async sendInAppNotification(
    data: SendNotificationDto,
  ): Promise<WorkflowResponseDto> {
    try {
      const knockClient = getKnockClient();
      const workflowKey = getKnockInAppWorkflowKey();

      // Check if workflow key is configured
      if (!workflowKey) {
        this.logger.warn(
          'Knock workflow key not configured - skipping notification',
          {
            recipients: data.recipients,
            title: data.title,
          },
        );
        return {
          success: false,
          workflowRunId: undefined,
        };
      }

      // Use workflow service to ensure recipients exist and trigger workflow
      const workflowRunId = await this.knockWorkflowService.triggerWorkflow(
        workflowKey,
        data.recipients,
        {
          title: data.title,
          text: data.text,
          metadata: data.metadata || {},
        },
        data.actorId ? { id: data.actorId } : { id: 'system', name: 'System' },
      );

      this.logger.log(
        `Sent in-app notification to ${data.recipients.length} users`,
      );

      return {
        success: true,
        workflowRunId: workflowRunId,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);

      this.logger.error('Error sending in-app notification:', {
        error: errorMessage,
        recipients: data.recipients,
        title: data.title,
      });

      // Don't throw error - let the calling code handle it gracefully
      // This prevents notification failures from blocking main business logic
      return {
        success: false,
        workflowRunId: undefined,
      };
    }
  }
}
