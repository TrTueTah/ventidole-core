import { MailerOptions } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { ENVIRONMENT } from "./env.config";
import { cwd } from "process";

export const initMailConfig = (): MailerOptions => ({
  transport: {
    host: ENVIRONMENT.MAIL_HOST,
    port: ENVIRONMENT.MAIL_PORT,
    secure: false,
    tls: { rejectUnauthorized: false },
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
    adapter: new HandlebarsAdapter(),
    options: {
      strict: true,
    },
  },
});
