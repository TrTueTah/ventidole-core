import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { BaseResponse } from '@shared/helper/response';

@Injectable()
export class AdminUsersService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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
}