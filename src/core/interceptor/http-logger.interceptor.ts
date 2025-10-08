import { ENVIRONMENT } from "@core/config/env.config";
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { NodeEnv } from "@shared/enum/environment.enum";
import { WinstonLogger } from "@shared/service/logger/winston.logger";
import chalk from "chalk";
import { Response } from "express";
import moment from "moment-timezone";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

const httpMethodColors = {
  GET: chalk.green.bold,
  POST: chalk.blue.bold,
  PUT: chalk.yellow.bold,
  DELETE: chalk.red.bold,
  PATCH: chalk.magenta.bold,
  OPTIONS: chalk.cyan.bold,
  HEAD: chalk.gray.bold,
};

const colorizeHttpMethod = (method: string) =>
  httpMethodColors[method] ? httpMethodColors[method](method) : chalk.white.bold(method);

@Injectable()
export class HttpLoggerInterceptor implements NestInterceptor {
  /* TODO: Send entire logs to the log service on cloud */
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (ENVIRONMENT.NODE_ENV === NodeEnv.Production) return next.handle();

    const request = context.switchToHttp().getRequest();
    const { method, originalUrl, body, query, params } = request;

    const startTime = moment();

    const payload = {
      body,
      query,
      params,
    };

    return next.handle().pipe(
      tap((response: Response) => {
        const endTime = moment();
        const duration = endTime.diff(startTime, "milliseconds");

        // NOTE: Don't log entire responses -> Leads to heavy performance
        WinstonLogger.http(`${colorizeHttpMethod(method)} ${originalUrl} ${chalk.green(`${duration}ms`)}`, {
          metadata: {
            request: payload,
            response: { statusCode: response.statusCode },
          },
        });
      }),
    );
  }
}
