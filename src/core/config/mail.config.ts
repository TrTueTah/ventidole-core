import { MailerOptions } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { cwd } from 'process';
import { ENVIRONMENT } from './env.config';

export const initMailConfig = (): MailerOptions => {
  console.log('[Mail Config] Initializing with:', {
    host: ENVIRONMENT.MAIL_HOST,
    port: ENVIRONMENT.MAIL_PORT,
    user: ENVIRONMENT.MAIL_USER,
    from: ENVIRONMENT.MAIL_FROM,
  });

  return {
    transport: {
      host: ENVIRONMENT.MAIL_HOST,
      port: ENVIRONMENT.MAIL_PORT,
      secure: false,
      family: 4, // Force IPv4
      tls: {
        rejectUnauthorized: false,
        ciphers: 'SSLv3',
      },
      auth: {
        user: ENVIRONMENT.MAIL_USER,
        pass: ENVIRONMENT.MAIL_PASSWORD,
      },
    },
    defaults: {
      from: ENVIRONMENT.MAIL_FROM,
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
};
