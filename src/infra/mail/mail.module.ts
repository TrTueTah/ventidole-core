import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { cwd } from 'process';
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
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const mailConfig = {
          host: configService.get<string>('MAIL_HOST'),
          port: configService.get<number>('MAIL_PORT'),
          user: configService.get<string>('MAIL_USER'),
          from: configService.get<string>('MAIL_FROM'),
        };

        console.log('[Mail Config] Initializing with:', mailConfig);

        return {
          transport: {
            host: mailConfig.host,
            port: mailConfig.port,
            secure: false,
            family: 4, // Force IPv4
            tls: {
              rejectUnauthorized: false,
              ciphers: 'SSLv3',
            },
            auth: {
              user: mailConfig.user,
              pass: configService.get<string>('MAIL_PASSWORD'),
            },
          },
          defaults: {
            from: mailConfig.from,
          },
          template: {
            dir: `${cwd()}/src/shared/service/mail/templates`,
            adapter: new HandlebarsAdapter(undefined, {
              inlineCssEnabled: false,
            }),
            options: {
              strict: true,
            },
          },
        };
      },
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
