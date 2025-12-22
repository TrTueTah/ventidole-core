import { Module } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminChatController } from './admin-chat.controller';
import { AdminChatService } from './admin-chat.service';

@Module({
  controllers: [AdminChatController],
  providers: [AdminChatService, PrismaService],
  exports: [AdminChatService],
})
export class AdminChatModule {}
