import { ENVIRONMENT } from "@core/config/env.config";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PassportStrategy } from "@nestjs/passport";
import { getErrorMessage } from "@shared/constant/error-message.constant";
import { ErrorCode } from "@shared/enum/error-code.enum";
import { RedisKey } from "@shared/enum/redis-key.enum";
import { TokenIssuer, TokenStrategyKey } from "@shared/enum/token.enum";
import { IJwtDecoded, IJwtPayload } from "@shared/interface/jwt-payload.interface";
import { RedisService } from "@shared/service/redis/redis.service";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../prisma/prisma.service";
import { UserModel } from "src/db/prisma/models";
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, TokenStrategyKey.Jwt) {
  constructor(
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private prismaService: PrismaService,
    // @InjectRepository(Account) private readonly accountRepository: EntityRepository<Account>,
  ) {
    super({
      ignoreExpiration: false,
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKeyProvider: (request: Request, rawJwtToken: string, done) => {
        const decoded = this.jwtService.decode<IJwtDecoded>(rawJwtToken, { complete: true });

        if (!decoded || typeof decoded !== "object")
          return done(new Error(getErrorMessage(ErrorCode.InvalidDecodeToken)), undefined);

        const { iss } = decoded.payload;

        if (iss === TokenIssuer.Access) return done(null, ENVIRONMENT.JWT_SECRET);
        if (iss === TokenIssuer.Sensitive) return done(null, ENVIRONMENT.JWT_SENSITIVE_SECRET);

        return done(new Error(getErrorMessage(ErrorCode.InvalidTokenIssuer)), undefined);
      },
    });
  }

  async validate(payload: IJwtPayload) {
    const cachedUser = await this.redisService.get<UserModel>(`${RedisKey.Account}${payload.sub}`);
    if (cachedUser) {
      const user = { id: cachedUser.id, role: cachedUser.role };
      return user;
    }

    // Find user in database
    const user = await this.prismaService.user.findFirst({
      where: { id: payload.sub, isActive: true, isDeleted: false }
    });

    if (user) {
      await this.redisService.set(`${RedisKey.Account}${user.id}`, user, ENVIRONMENT.JWT_EXPIRED);
      return { id: user.id, role: user.role };
    }

    return null;
  }
}
