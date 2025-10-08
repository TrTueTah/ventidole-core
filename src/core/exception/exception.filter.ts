import { CustomHttpException } from "@core/exception/custom-http.exception";
import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { getErrorMessage } from "@shared/constant/error-message.constant";
import { ErrorCode, isErrorCode } from "@shared/enum/error-code.enum";
import { CustomError } from "@shared/helper/error";
import { BaseResponse } from "@shared/helper/response";
import { IException, IExceptionDetail } from "@shared/interface/exception.interface";
import { WinstonLogger } from "@shared/service/logger/winston.logger";
import chalk from "chalk";
import moment from "moment";

@Catch()
export class UnhandledExceptionFilter implements ExceptionFilter {
  /* TODO: Send entire exceptions to the log service on cloud */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const { statusCode, errorCode, message } = this.getExceptionDetail(exception);

    const errorResponse: IException = {
      statusCode,
      errorCode,
      message,
      method: request.method,
      path: request.url,
      timestamp: moment().toISOString(),
      exception,
    };

    WinstonLogger.error(`${chalk.redBright(UnhandledExceptionFilter.name)}`, { metadata: errorResponse });
    if (response.headersSent) {
      console.warn("Response already sent, skipping error response:", {
        method: request.method,
        path: request.url,
        errorCode,
        message,
      });
      return; // skip
    }
    response
      .status(statusCode)
      .json(
        BaseResponse.exception(errorResponse.statusCode, errorCode, errorResponse.message, errorResponse.exception),
      );
  }

  private serializeHttpError(statusCode: number, message: string): IExceptionDetail {
    return isErrorCode(message)
      ? { statusCode, errorCode: message, message: getErrorMessage(message) }
      : { statusCode, errorCode: ErrorCode.HttpError, message };
  }

  private getExceptionDetail(exception: unknown): IExceptionDetail {
    if (exception instanceof CustomError)
      return { statusCode: HttpStatus.BAD_REQUEST, errorCode: exception.errorCode, message: exception.message };

    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === "string") return this.serializeHttpError(exception.getStatus(), response);

      if (typeof response === "object") {
        if ("message" in response) return this.serializeHttpError(exception.getStatus(), response.message as string);

        if (response instanceof CustomHttpException)
          return {
            statusCode: exception.getStatus(),
            errorCode: response.errorCode,
            message: getErrorMessage(response.errorCode, response.params),
          };
      }
    }

    return {
      statusCode: HttpStatus.BAD_REQUEST,
      errorCode: ErrorCode.UnknownError,
      message: exception instanceof Error ? exception.message : getErrorMessage(ErrorCode.UnknownError),
    };
  }
}
