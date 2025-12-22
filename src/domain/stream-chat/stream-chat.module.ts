import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/service/prisma/prisma.module';
import { KnockWorkflowModule } from '@shared/service/knock-workflow/knock-workflow.module';
import { GetStreamNotificationModule } from '@shared/service/getstream-notification/getstream-notification.module';
import { StreamChatController } from './stream-chat.controller';
import { StreamChatService } from './stream-chat.service';
import { StreamChatWebhookController } from './stream-chat-webhook.controller';
import { StreamChatWebhookService } from './stream-chat-webhook.service';

@Module({
  imports: [PrismaModule, KnockWorkflowModule, GetStreamNotificationModule],
  controllers: [StreamChatController, StreamChatWebhookController],
  providers: [StreamChatService, StreamChatWebhookService],
  exports: [StreamChatService, StreamChatWebhookService],
})
export class StreamChatModule {}
