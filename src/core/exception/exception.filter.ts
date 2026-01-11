import { CustomHttpException } from '@core/exception/custom-http.exception';
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { WinstonLogger } from '@shared/service/logger/winston.logger';
import chalk from 'chalk';
import moment from 'moment';
import { BaseResponse } from '../response/base-response';
import { CoreErrorCode, isCoreErrorCode } from '../types/error-code.enum';
import { CustomError } from './custom-error';
import { IException, IExceptionDetail } from './exception.interface';

@Catch()
export class UnhandledExceptionFilter implements ExceptionFilter {
  /* TODO: Send entire exceptions to the log service on cloud */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const { statusCode, errorCode, message } =
      this.getExceptionDetail(exception);

    const errorResponse: IException = {
      statusCode,
      errorCode,
      message,
      method: request.method,
      path: request.url,
      timestamp: moment().toISOString(),
      exception,
    };

    WinstonLogger.error(`${chalk.redBright(UnhandledExceptionFilter.name)}`, {
      metadata: errorResponse,
    });
    if (response.headersSent) {
      console.warn('Response already sent, skipping error response:', {
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
        BaseResponse.exception(
          errorResponse.statusCode,
          errorCode,
          errorResponse.message,
          errorResponse.exception,
        ),
      );
  }

  private serializeHttpError(
    statusCode: number,
    message: string,
  ): IExceptionDetail {
    return isCoreErrorCode(message)
      ? { statusCode, errorCode: message, message }
      : { statusCode, errorCode: CoreErrorCode.HttpError, message };
  }

  private getExceptionDetail(exception: unknown): IExceptionDetail {
    if (exception instanceof CustomError)
      return {
        statusCode: exception.statusCode,
        errorCode: exception.code,
        message: exception.message,
      };

    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === 'string')
        return this.serializeHttpError(exception.getStatus(), response);

      if (typeof response === 'object') {
        if ('message' in response)
          return this.serializeHttpError(
            exception.getStatus(),
            response.message as string,
          );

        if (response instanceof CustomHttpException)
          return {
            statusCode: exception.getStatus(),
            errorCode: response.errorCode,
            message: response.errorCode, // Use error code as message for now
          };
      }
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      errorCode: CoreErrorCode.UnknownError,
      message:
        exception instanceof Error
          ? exception.message
          : CoreErrorCode.UnknownError,
    };
  }
}
