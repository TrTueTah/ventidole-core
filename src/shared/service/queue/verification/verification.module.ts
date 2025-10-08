import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { QueueName } from "@shared/enum/queue.enum";
import { MailModule } from "@shared/service/mail/mail.module";
import { VerificationConsumer } from "@shared/service/queue/verification/verification.consumer";
import { VerificationProducer } from "@shared/service/queue/verification/verification.producer";

@Module({
  imports: [BullModule.registerQueue({ name: QueueName.Verification }), MailModule],
  providers: [VerificationProducer, VerificationConsumer],
  exports: [VerificationProducer],
})
export class QueueVerificationModule {}
