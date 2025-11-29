import { Module } from '@nestjs/common';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TokenStrategyKey } from '@shared/enum/token.enum';
import { TokenModule } from '@shared/service/token/token.module';

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: TokenStrategyKey.Jwt }),
    TokenModule,
  ],
  controllers: [AdminAuthController],
  providers: [AdminAuthService, PrismaService],
  exports: [AdminAuthService],
})
export class AdminAuthModule {}
