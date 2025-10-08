import { initMailConfig } from "@core/config/mail.config";
import { MailerModule } from "@nestjs-modules/mailer";
import { Module } from "@nestjs/common";
import { MailService } from "@shared/service/mail/mail.service";

@Module({
  imports: [
    MailerModule.forRootAsync({
      useFactory: async () => initMailConfig(),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
