import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthApplicationService } from './auth.service';
import { AuthDomainService } from '@domain/identity/auth/auth.domain-service';
import { UserRepositoryPrisma } from '@infra/prisma/identity/user/user.repository.prisma';
import { JwtStrategy } from '@core/strategy/jwt.strategy';
import { EventBus } from '@core/event/event-bus.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { VerificationService } from '@infra/verification/verification.service';
import { StreamChatService } from '@infra/stream-chat/stream-chat.service';

/**
 * Auth Module
 *
 * Wires together:
 * - Auth controller (HTTP layer)
 * - Auth application service (use case orchestration)
 * - JWT strategy (authentication)
 * - User repository (Prisma implementation)
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: '15m',
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    // Application Service
    AuthApplicationService,

    // Domain Service
    AuthDomainService,

    // JWT Strategy
    JwtStrategy,

    // Repository (bind interface to implementation)
    {
      provide: 'UserRepository',
      useClass: UserRepositoryPrisma,
    },

    // Infrastructure
    EventBus,
    PrismaService,
    VerificationService,
    StreamChatService,
  ],
  exports: [AuthApplicationService, JwtStrategy, VerificationService],
})
export class AuthModule {}
