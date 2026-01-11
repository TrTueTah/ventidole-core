import { Injectable, Logger } from '@nestjs/common';
import { MailerService, ISendMailOptions } from '@nestjs-modules/mailer';

/**
 * Mail Service
 *
 * Infrastructure service for sending emails via SMTP.
 *
 * Responsibilities:
 * - Send transactional emails
 * - Send OTP verification emails
 * - Template rendering with Handlebars
 *
 * Note: This is a thin wrapper around MailerService.
 */
@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  constructor(private readonly mailerService: MailerService) {}

  /**
   * Send OTP verification email
   */
  async sendOTPEmail(
    email: string,
    otp: string,
    expirationMinutes: number,
  ): Promise<void> {
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Ventidole - Email Verification Code',
        template: 'otp-auth',
        context: {
          otp,
          expiration: expirationMinutes,
          year: new Date().getFullYear(),
        },
      });

      this.logger.log(`OTP email sent to: ${email}`);
    } catch (error) {
      this.logger.error(`Failed to send OTP email to ${email}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send generic email (for future use)
   */
  async sendEmail(options: ISendMailOptions): Promise<void> {
    try {
      await this.mailerService.sendMail(options);
      this.logger.log(`Email sent to: ${options.to}`);
    } catch (error) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }
}
