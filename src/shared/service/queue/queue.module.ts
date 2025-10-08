import { initQueueConfig } from "@core/config/queue.config";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { QueueVerificationModule } from "@shared/service/queue/verification/verification.module";

@Module({
  imports: [BullModule.forRootAsync({ useFactory: async () => initQueueConfig() }), QueueVerificationModule],
})
export class QueueModule {}
