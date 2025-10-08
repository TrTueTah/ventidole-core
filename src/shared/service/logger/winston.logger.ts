import { ENVIRONMENT } from "@core/config/env.config";
import { DateTimeFormat } from "@shared/enum/date-format.enum";
import { NodeEnv } from "@shared/enum/environment.enum";
import chalk from "chalk";
import moment from "moment-timezone";
import { createLogger, format, LoggerOptions, transports } from "winston";

enum LogLevel {
  Error = 'error',
  Warn = 'warn',
  Info = 'info',
  Http = 'http',
  Debug = 'debug',
  Verbose = 'verbose',
  Silly = 'silly',
}

const colorizeLevel = (level: LogLevel): string => {
  const levelUpperCase = level.toUpperCase();
  switch (level) {
    case LogLevel.Error:
      return chalk.red.bold(levelUpperCase);
    case LogLevel.Warn:
      return chalk.yellow.bold(levelUpperCase);
    case LogLevel.Info:
      return chalk.green.bold(levelUpperCase);
    case LogLevel.Http:
      return chalk.cyan.bold(levelUpperCase);
    case LogLevel.Debug:
      return chalk.blue.bold(levelUpperCase);
    default:
      return levelUpperCase;
  }
};

const customFormat = (
  timestamp: string,
  level: LogLevel,
  message: string,
  metadata: object,
) =>
  `${chalk.gray(`[${timestamp}]`)} - [${colorizeLevel(level)}] - ${message} ${metadata ? `\n${JSON.stringify(metadata, null, 2)}` : ''}`;

const winstonFormat = format.printf(
  ({ timestamp, level, message, stack, metadata }): string => {
    const formattedTime = moment(timestamp as string)
      .tz(moment.tz.guess())
      .format(DateTimeFormat.YYYY_MM_DD_HH_MM_SS_Z);

    return customFormat(
      formattedTime,
      level as LogLevel,
      (stack || message) as string,
      metadata as object,
    );
  },
);

const loggerOptions: LoggerOptions = {
  level:
    ENVIRONMENT.NODE_ENV === NodeEnv.Production
      ? LogLevel.Error
      : LogLevel.Debug,
  format: format.combine(
    format.timestamp(),
    format.errors({ stack: true }),
    format.align(),
    winstonFormat,
  ),
  transports: [new transports.Console()],
};

export const WinstonLogger = createLogger(loggerOptions);
