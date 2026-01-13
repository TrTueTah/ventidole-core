import { StreamChatModule } from '@domain/stream-chat/stream-chat.module';
import { Module, forwardRef } from '@nestjs/common';
import { GetStreamNotificationModule } from '@shared/service/getstream-notification/getstream-notification.module';
import { KnockWorkflowModule } from '@shared/service/knock-workflow/knock-workflow.module';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';

@Module({
  imports: [
    GetStreamNotificationModule,
    KnockWorkflowModule,
    forwardRef(() => StreamChatModule),
  ],
  controllers: [AdminUserController],
  providers: [AdminUserService, PrismaService],
  exports: [AdminUserService],
})
export class AdminUserModule {}
