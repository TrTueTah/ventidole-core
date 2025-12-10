import { Module } from '@nestjs/common';
import { StreamChatController } from './stream-chat.controller';
import { StreamChatService } from './stream-chat.service';

@Module({
  controllers: [StreamChatController],
  providers: [StreamChatService],
  exports: [StreamChatService],
})
export class StreamChatModule {}
