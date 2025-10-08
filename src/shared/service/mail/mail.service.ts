import { ENVIRONMENT } from "@core/config/env.config";
import { ISendMailOptions, MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { getErrorMessage } from "@shared/constant/error-message.constant";
import { getMessage } from "@shared/constant/message.constant";
import { ErrorCode } from "@shared/enum/error-code.enum";
import { MessageCode } from "@shared/enum/message-code.enum";
import { CustomError } from "@shared/helper/error";
import { WinstonLogger } from "@shared/service/logger/winston.logger";
import { cwd } from "process";

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  async sendEmail(params: ISendMailOptions) {
    try {
      const mailTo = (params?.to ? (Array.isArray(params.to) ? params.to.filter((to) => to) : params.to) : []) as
        | string
        | string[];

      if (!mailTo.length) throw new CustomError(ErrorCode.NotAnyRecipient);
      console.log(`${cwd()}/src/shared/service/mail/templates`)
      const sendMailParams = {
        to: mailTo,
        subject: params.subject,
        context: params.context,
        template: 'otp-auth'
      };

      const response = await this.mailerService.sendMail(sendMailParams);

      WinstonLogger.info(getMessage(MessageCode.SendMailSuccessfully, JSON.stringify(sendMailParams)), {
        metadata: response,
      });
    } catch (error) {
      WinstonLogger.error(getErrorMessage(ErrorCode.SendMailFailed, error.message), { metadata: params });
      console.log('error', error);
    }
  }
}
