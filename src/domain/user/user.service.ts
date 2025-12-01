import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/service/prisma/prisma.service";
import { UpdateStatusRequest } from "./request/update-status.request";
import { UpdateUserRequest } from "./request/update-user.request";
import { CustomError } from "@shared/helper/error";
import { ErrorCode } from "@shared/enum/error-code.enum";
import { UserStatus } from "@shared/enum/user-status.enum";
import { BaseResponse } from "@shared/helper/response";
import { IRequest } from "@shared/interface/request.interface";

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getCurrentUser(request: IRequest) {
    const userId = request.user.id;
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      include: {
        community: true,
      },
    });

    if (!user) {
      throw new CustomError(ErrorCode.AccountNotFound);
    }

    return BaseResponse.of(this.formatUserData(user));
  }

  async getUserById(userId: string, request: IRequest) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      include: {
        community: true,
      },
    });

    if (!user) {
      throw new CustomError(ErrorCode.AccountNotFound);
    }

    // Remove sensitive information if viewing another user's profile
    if (request.user.id !== userId) {
      return BaseResponse.of(this.formatPublicUserData(user));
    }

    return BaseResponse.of(this.formatUserData(user));
  }

  async updateProfile(body: UpdateUserRequest, request: IRequest) {
    const userId = request.user.id;

    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
    });

    if (!existingUser) {
      throw new CustomError(ErrorCode.AccountNotFound);
    }

    // Check email uniqueness if email is being updated
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findFirst({
        where: {
          email: body.email,
          isDeleted: false,
          id: { not: userId },
        },
      });

      if (emailExists) {
        throw new CustomError(ErrorCode.EmailAlreadyExists);
      }
    }

    // Check username uniqueness if username is being updated
    if (body.username && body.username !== existingUser.username) {
      const usernameExists = await this.prisma.user.findFirst({
        where: {
          username: body.username,
          isDeleted: false,
          id: { not: userId },
        },
      });

      if (usernameExists) {
        throw new CustomError(ErrorCode.UsernameAlreadyExists);
      }
    }

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.email && { email: body.email }),
        ...(body.username && { username: body.username }),
        ...(body.deviceToken !== undefined && { deviceToken: body.deviceToken }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
        ...(body.backgroundUrl !== undefined && { backgroundUrl: body.backgroundUrl }),
        ...(body.bio !== undefined && { bio: body.bio }),
      },
      include: {
        community: true,
      },
    });

    return BaseResponse.of(this.formatUserData(updatedUser));
  }

  async updateStatus(request: UpdateStatusRequest) {
    const { userId, status } = request;
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
    });
    if (!user) {
      throw new CustomError(ErrorCode.AccountNotFound)
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { isActive: status === UserStatus.ACTIVE ? true : false },
    });
    return BaseResponse.ok();
  }

  // Helper methods to format user data
  private formatUserData(user: any) {
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      deviceToken: user.deviceToken,
      avatarUrl: user.avatarUrl,
      backgroundUrl: user.backgroundUrl,
      bio: user.bio,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(user.community && { community: user.community }),
    };
  }

  private formatPublicUserData(user: any) {
    // Remove sensitive information like email and deviceToken
    return {
      id: user.id,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl,
      backgroundUrl: user.backgroundUrl,
      bio: user.bio,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(user.community && { community: user.community }),
    };
  }
}