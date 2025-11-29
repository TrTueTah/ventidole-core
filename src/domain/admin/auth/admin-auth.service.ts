import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { Role } from 'src/db/prisma/enums';
import * as bcrypt from 'bcryptjs';
import { TokenIssuer } from '@shared/enum/token.enum';
import { ENVIRONMENT } from '@core/config/env.config';
import { BaseResponse } from '@shared/helper/response';
import { TokenService } from '@shared/service/token/token.service';
import { UserModel } from 'src/db/prisma/models';
import { RedisService } from '@shared/service/redis/redis.service';
import { RedisKey } from '@shared/enum/redis-key.enum';
import { AdminSignupRequest } from './request/admin-signup.request';
import { RefreshTokenRequest } from '@domain/auth/request/refresh-token.request';
import { IJwtDecoded } from '@shared/interface/jwt-payload.interface';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly tokenService: TokenService,
    private readonly redisService: RedisService,
  ) {}

  async adminLogin(body: any) {
    // Find user with ADMIN role
    const user = await this.prisma.user.findFirst({
      where: {
        email: body.email,
        role: Role.ADMIN,
        isDeleted: false,
      },
    });

    if (!user) {
      throw new CustomError(ErrorCode.InvalidEmailOrPassword);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(body.password, user.password);
    if (!isPasswordValid) {
      throw new CustomError(ErrorCode.InvalidEmailOrPassword);
    }

    // Generate tokens
    const [accessToken, refreshToken] = await this.generateTokens(user);

    // Activate user if not active (bypass verification)
    if (!user.isActive) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { isActive: true },
      });
    }

    return BaseResponse.of({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: 'Admin',
      accessToken,
      refreshToken,
    });
  }

  async adminSignup(body: AdminSignupRequest) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new CustomError(ErrorCode.EmailAlreadyExists);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create admin user (bypass verification, instantly active)
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        role: Role.ADMIN,
        username: body.username,
        isActive: true, // Bypass verification
      },
    });

    // Generate tokens
    const [accessToken, refreshToken] = await this.generateTokens(user);

    return BaseResponse.of({
      userId: user.id,
      email: user.email,
      role: user.role,
      username: user.username,
      accessToken,
      refreshToken,
    });
  }

  async refreshNewToken(request: RefreshTokenRequest) {
    try {
      const { token, refreshToken } = request;

      const decodedToken = this.jwtService.decode<IJwtDecoded>(token, {
        complete: true,
      });
      if (!decodedToken || typeof decodedToken !== 'object')
        throw new CustomError(ErrorCode.InvalidDecodeToken);

      let secret = '';

      if (decodedToken.payload.iss === TokenIssuer.Access)
        secret = ENVIRONMENT.JWT_SECRET;
      else if (decodedToken.payload.iss === TokenIssuer.Sensitive)
        secret = ENVIRONMENT.JWT_SENSITIVE_SECRET;

      if (!secret) throw new CustomError(ErrorCode.InvalidTokenSecret);

      const refreshTokenPayload = this.tokenService.validateRefreshToken(
        token,
        refreshToken,
        secret,
      );

      const user = await this.prisma.user.findFirst({
        where: {
          id: refreshTokenPayload.sub,
          isActive: true,
          isDeleted: false,
        },
      });
      if (!user) throw new CustomError(ErrorCode.Unauthenticated);

      const [newAccessToken, newRefreshToken] = await this.generateTokens(user);

      return BaseResponse.of({
        userId: user.id,
        email: user.email,
        role: user.role,
        username: user.username,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      });
    } catch (error) {
      throw error;
    }
  }

  private async generateTokens(user: UserModel) {
    const accessToken = this.tokenService.generateAccessToken(user);
    const refreshToken = this.tokenService.generateRefreshToken(
      user,
      accessToken,
      ENVIRONMENT.JWT_SECRET,
    );

    await this.redisService.set(
      `${RedisKey.Account}${user.id}`,
      user,
      ENVIRONMENT.JWT_EXPIRED,
    );

    return [accessToken, refreshToken];
  }
}
