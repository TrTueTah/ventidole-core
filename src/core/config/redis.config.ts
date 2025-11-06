import { getMessage } from "@shared/constant/message.constant";
import { MessageCode } from "@shared/enum/message-code.enum";
import { WinstonLogger } from "@shared/service/logger/winston.logger";
import { RedisOptions } from "ioredis";
import { ENVIRONMENT } from "./env.config";

export const REDIS_CLIENT = 'REDIS_CLIENT';
export const REDIS_MAX_RETRY_DURATION = 5 * 60 * 1000; // 5 minutes

type RedisRetryStrategyType = {
  delay: number | null;
  retryDuration: number;
};

export const redisRetryStrategy = (
  times: number,
  totalRetryDuration: number,
): RedisRetryStrategyType => {
  // Exponential backoff, cap at 30 seconds
  const delay = Math.min(1000 * 2 ** times, 30000);
  const currentRetryDuration = totalRetryDuration + delay;

  if (currentRetryDuration >= REDIS_MAX_RETRY_DURATION) {
    WinstonLogger.error(getMessage(MessageCode.RedisMaxRetryAttempt));
    return {
      delay: null,
      retryDuration: currentRetryDuration,
    };
  }

  WinstonLogger.info(getMessage(MessageCode.RedisRetrying, times, delay));
  return {
    delay,
    retryDuration: currentRetryDuration,
  };
};

export const initRedisConfig = (): RedisOptions => {
  let totalRetryDuration = 0;

  return {
    host: ENVIRONMENT.REDIS_HOST,
    port: ENVIRONMENT.REDIS_PORT,
    username: ENVIRONMENT.REDIS_USER,
    password: ENVIRONMENT.REDIS_PASSWORD,
    showFriendlyErrorStack: true,
    commandTimeout: 1000,
    retryStrategy: (times) => {
      const { delay, retryDuration } = redisRetryStrategy(
        times,
        totalRetryDuration,
      );

      totalRetryDuration = retryDuration;
      return delay;
    },
  };
};
