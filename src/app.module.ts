import { initEnvironmentConfig } from "@core/config/env.config";
import { AuthModule } from "@domain/auth/auth.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { QueueModule } from "@shared/service/queue/queue.module";
import { RedisModule } from "@shared/service/redis/redis.module";

@Module({
  imports: [
    ConfigModule.forRoot(initEnvironmentConfig()),
    RedisModule,
    QueueModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
