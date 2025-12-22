import { Body, Controller, Logger, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { StreamChatWebhookService } from './stream-chat-webhook.service';

/**
 * Controller for handling GetStream webhooks
 * This receives events from GetStream and triggers notifications
 */
@ApiTags('Stream Chat Webhooks')
@Controller({ path: 'webhooks/getstream', version: ApiVersion.V1 })
export class StreamChatWebhookController {
  private readonly logger = new Logger(StreamChatWebhookController.name);

  constructor(
    private readonly webhookService: StreamChatWebhookService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Handle GetStream webhook events' })
  async handleWebhook(@Body() event: any): Promise<{ success: boolean }> {
    this.logger.log(`Received GetStream webhook: ${event.type}`);

    try {
      // Handle different event types
      switch (event.type) {
        case 'message.new':
          await this.webhookService.handleNewMessage(event);
          break;

        case 'message.deleted':
          await this.webhookService.handleMessageDeleted(event);
          break;

        case 'member.added':
          await this.webhookService.handleMemberAdded(event);
          break;

        case 'member.removed':
          await this.webhookService.handleMemberRemoved(event);
          break;

        default:
          this.logger.log(`Unhandled webhook event type: ${event.type}`);
      }

      return { success: true };
    } catch (error) {
      this.logger.error(`Error handling webhook event:`, error.message);
      // Return success anyway to prevent GetStream from retrying
      return { success: true };
    }
  }
}
