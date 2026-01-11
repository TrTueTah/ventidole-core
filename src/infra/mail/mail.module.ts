import { Module, Global } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { initMailConfig } from '@core/config/mail.config';
import { MailService } from './mail.service';

/**
 * Mail Module
 *
 * Provides email sending functionality across the application.
 *
 * Wires together:
 * - MailerModule (NestJS mailer)
 * - Mail configuration
 * - MailService (infrastructure service)
 */
@Global() // Make available globally without importing
@Module({
  imports: [
    MailerModule.forRoot(initMailConfig()),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
