import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { StreamChatController } from './stream-chat.controller';
import { StreamChatService } from './stream-chat.service';
import { JwtStrategy } from '@shared/service/token/jwt.strategy';

@Module({
  imports: [
    ConfigModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
  ],
  controllers: [StreamChatController],
  providers: [StreamChatService, JwtStrategy],
  exports: [StreamChatService],
})
export class StreamChatModule {}
