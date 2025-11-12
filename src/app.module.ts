import { initEnvironmentConfig } from "@core/config/env.config";
import { AuthModule } from "@domain/auth/auth.module";
import { PostModule } from "@domain/post/post.module";
import { CommentModule } from "@domain/comment/comment.module";
import { ReplyModule } from "@domain/reply/reply.module";
import { UserModule } from "@domain/user/user.module";
import { ChatModule } from "@domain/chat/chat.module";
import { AdminModule } from "@domain/admin/admin.module";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { QueueModule } from "@shared/service/queue/queue.module";
import { RedisModule } from "@shared/service/redis/redis.module";
import { FileModule } from "@domain/file/file.module";

@Module({
  imports: [
    ConfigModule.forRoot(initEnvironmentConfig()),
    RedisModule,
    QueueModule,
    FileModule,
    AuthModule,
    UserModule,
    PostModule,
    CommentModule,
    ReplyModule,
    ChatModule,
    AdminModule
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
