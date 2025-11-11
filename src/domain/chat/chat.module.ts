import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { FirebaseService } from '@shared/service/firebase/firebase.service';
import { NotificationModule } from '@shared/service/notification/notification.module';
import { JwtStrategy } from '@shared/service/token/jwt.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    NotificationModule,
  ],
  controllers: [ChatController],
  providers: [
    ChatService,
    ChatGateway,
    PrismaService,
    FirebaseService,
    JwtStrategy,
  ],
  exports: [ChatService, ChatGateway],
})
export class ChatModule {}
