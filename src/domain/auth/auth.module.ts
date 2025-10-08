import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { TokenStrategyKey } from "@shared/enum/token.enum";
import { OtpModule } from "@shared/service/otp/otp.module";
import { QueueVerificationModule } from "@shared/service/queue/verification/verification.module";
import { TokenModule } from "@shared/service/token/token.module";
import { JwtStrategy } from "@shared/service/token/jwt.strategy";
import { PrismaModule } from "@shared/service/prisma/prisma.module";

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule.register({ defaultStrategy: TokenStrategyKey.Jwt }),
    OtpModule,
    TokenModule,
    QueueVerificationModule,
    PrismaModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
