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

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
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
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        issuer: TokenIssuer.Access,
        secret: ENVIRONMENT.JWT_SECRET,
        expiresIn: '7d',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        issuer: TokenIssuer.Refresh,
        secret: ENVIRONMENT.JWT_SECRET,
        expiresIn: '30d',
      },
    );

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

  async adminSignup(body: any) {
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
        isActive: true, // Bypass verification
        isOnline: false,
      },
    });

    // Generate tokens
    const accessToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        issuer: TokenIssuer.Access,
        secret: ENVIRONMENT.JWT_SECRET,
        expiresIn: '7d',
      },
    );

    const refreshToken = this.jwtService.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      {
        issuer: TokenIssuer.Refresh,
        secret: ENVIRONMENT.JWT_SECRET,
        expiresIn: '30d',
      },
    );

    return BaseResponse.of({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: body.name,
      accessToken,
      refreshToken,
    });
  }
}
