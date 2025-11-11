import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { BaseResponse } from '@shared/helper/response';
import { Role } from 'src/db/prisma/enums';
import { TokenIssuer } from '@shared/enum/token.enum';
import { ENVIRONMENT } from '@core/config/env.config';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Admin login (bypass all verification)
   * Only for users with ADMIN role
   */
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
      }
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
      }
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

  /**
   * Admin signup (bypass all verification)
   * Creates admin account instantly without email verification
   */
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
      }
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
      }
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

  /**
   * Create a new idol account with user credentials and profile
   * Only accessible by ADMIN role
   */
  async createIdolAccount(body: any) {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: body.email },
    });

    if (existingUser) {
      throw new CustomError(ErrorCode.EmailAlreadyExists);
    }

    // Check if group exists
    const group = await this.prisma.group.findUnique({
      where: { id: body.groupId },
    });

    if (!group) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(body.password, 10);

    // Create User and Idol in a transaction
    const user = await this.prisma.user.create({
      data: {
        email: body.email,
        password: hashedPassword,
        role: Role.IDOL,
        deviceToken: body.deviceToken,
        idol: {
          create: {
            stageName: body.stageName,
            groupId: body.groupId,
            avatarUrl: body.avatarUrl,
            backgroundUrl: body.backgroundUrl,
            bio: body.bio,
          },
        },
      },
      include: {
        idol: {
          include: {
            group: true,
          },
        },
      },
    });

    // Generate tokens for the new idol
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
      }
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
      }
    );

    return BaseResponse.of({
      userId: user.id,
      email: user.email,
      role: user.role,
      idol: user.idol,
      accessToken,
      refreshToken,
    });
  }

  /**
   * Create a new group
   * Only accessible by ADMIN role
   */
  async createGroup(body: any) {
    // Check if group name already exists
    const existingGroup = await this.prisma.group.findFirst({
      where: { groupName: body.groupName },
    });

    if (existingGroup) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Create group
    const group = await this.prisma.group.create({
      data: {
        groupName: body.groupName,
        description: body.description,
        logoUrl: body.logoUrl,
        backgroundUrl: body.backgroundUrl,
      },
    });

    return BaseResponse.of(group);
  }

  /**
   * Get all groups
   */
  async getAllGroups() {
    const groups = await this.prisma.group.findMany({
      where: { isActive: true },
      include: {
        idols: {
          where: { isActive: true },
          select: {
            id: true,
            stageName: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            idols: true,
            followers: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return BaseResponse.of(groups);
  }

  /**
   * Get all idols
   */
  async getAllIdols() {
    const idols = await this.prisma.idol.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isOnline: true,
            isActive: true,
            createdAt: true,
          },
        },
        group: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return BaseResponse.of(idols);
  }

  /**
   * Get all fans
   */
  async getAllFans() {
    const fans = await this.prisma.fan.findMany({
      where: { isActive: true },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            role: true,
            isOnline: true,
            isActive: true,
            createdAt: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return BaseResponse.of(fans);
  }

  /**
   * Get all users with their profiles
   */
  async getAllUsers() {
    const users = await this.prisma.user.findMany({
      where: { isDeleted: false },
      include: {
        fan: true,
        idol: {
          include: {
            group: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return BaseResponse.of(users);
  }

  /**
   * Deactivate a user account
   */
  async deactivateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomError(ErrorCode.AccountNotFound);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: false },
    });

    return BaseResponse.ok();
  }

  /**
   * Activate a user account
   */
  async activateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomError(ErrorCode.AccountNotFound);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: true },
    });

    return BaseResponse.ok();
  }

  /**
   * Delete a user account (soft delete)
   */
  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new CustomError(ErrorCode.AccountNotFound);
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isDeleted: true, isActive: false },
    });

    return BaseResponse.ok();
  }

  /**
   * Get platform statistics
   */
  async getStatistics() {
    const [totalUsers, totalFans, totalIdols, totalGroups, onlineUsers] = await Promise.all([
      this.prisma.user.count({ where: { isDeleted: false } }),
      this.prisma.fan.count({ where: { isActive: true } }),
      this.prisma.idol.count({ where: { isActive: true } }),
      this.prisma.group.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isOnline: true, isDeleted: false } }),
    ]);

    return BaseResponse.of({
      totalUsers,
      totalFans,
      totalIdols,
      totalGroups,
      onlineUsers,
    });
  }
}
