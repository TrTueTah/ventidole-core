import { initRedisConfig, REDIS_CLIENT } from "@core/config/redis.config";
import { Global, Module } from "@nestjs/common";
import { getMessage } from "@shared/constant/message.constant";
import { MessageCode } from "@shared/enum/message-code.enum";
import { WinstonLogger } from "@shared/service/logger/winston.logger";
import { RedisService } from "@shared/service/redis/redis.service";
import Redis from "ioredis";

@Global()
@Module({
  providers: [
    RedisService,
    {
      provide: REDIS_CLIENT,
      useFactory: async () => {
        const client = new Redis(initRedisConfig());
        client.on("error", (error) => WinstonLogger.error(getMessage(MessageCode.RedisFailedToConnect, error.message)));
        client.on("connect", () => WinstonLogger.info(getMessage(MessageCode.RedisConnected)));

        return client;
      },
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
