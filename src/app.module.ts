import { initEnvironmentConfig } from "@core/config/env.config";
import { AuthModule } from "@domain/auth/auth.module";
import { PostModule } from "@domain/post/post.module";
import { UserModule } from "@domain/user/user.module";
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
    UserModule,
    PostModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
