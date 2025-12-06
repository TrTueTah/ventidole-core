import { initEnvironmentConfig } from '@core/config/env.config';
import { AdminModule } from '@domain/admin/admin.module';
import { AuthModule } from '@domain/auth/auth.module';
import { FileModule } from '@domain/file/file.module';
import { UserModule } from '@domain/user/user.module';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { QueueModule } from '@shared/service/queue/queue.module';
import { RedisModule } from '@shared/service/redis/redis.module';

@Module({
  imports: [
    ConfigModule.forRoot(initEnvironmentConfig()),
    RedisModule,
    QueueModule,
    AuthModule,
    FileModule,
    UserModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
