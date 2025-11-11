import { Injectable } from "@nestjs/common";
import { PrismaService } from "@shared/service/prisma/prisma.service";
import { UpdateStatusRequest } from "./request/update-status.request";
import { UpdateUserRequest } from "./request/update-user.request";
import { UpdateFanRequest } from "./request/update-fan.request";
import { UpdateIdolRequest } from "./request/update-idol.request";
import { CustomError } from "@shared/helper/error";
import { ErrorCode } from "@shared/enum/error-code.enum";
import { UserStatus } from "@shared/enum/user-status.enum";
import { BaseResponse } from "@shared/helper/response";
import { IRequest } from "@shared/interface/request.interface";
import { Role } from "src/db/prisma/enums";

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
        fan: true,
        idol: true,
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
        fan: true,
        idol: true,
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

    // Update user
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(body.email && { email: body.email }),
        ...(body.deviceToken !== undefined && { deviceToken: body.deviceToken }),
        ...(body.isOnline !== undefined && { isOnline: body.isOnline }),
      },
      include: {
        fan: true,
        idol: true,
      },
    });

    return BaseResponse.of(this.formatUserData(updatedUser));
  }

  async updateFanProfile(body: UpdateFanRequest, request: IRequest) {
    const userId = request.user.id;

    // Check if user is a fan
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isDeleted: false, role: Role.FAN },
      include: { fan: true },
    });

    if (!user) {
      throw new CustomError(ErrorCode.AccountNotFound);
    }

    if (!user.fan) {
      throw new CustomError(ErrorCode.FanProfileNotFound);
    }

    // Check username uniqueness if username is being updated
    if (body.username && body.username !== user.fan.username) {
      const usernameExists = await this.prisma.fan.findFirst({
        where: {
          username: body.username,
          id: { not: user.fan.id },
        },
      });

      if (usernameExists) {
        throw new CustomError(ErrorCode.UsernameAlreadyExists);
      }
    }

    // Update fan profile
    const updatedFan = await this.prisma.fan.update({
      where: { id: user.fan.id },
      data: {
        ...(body.username && { username: body.username }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
        ...(body.backgroundUrl !== undefined && { backgroundUrl: body.backgroundUrl }),
        ...(body.bio !== undefined && { bio: body.bio }),
      },
    });

    return BaseResponse.of(updatedFan);
  }

  async createFanProfile(body: any, request: IRequest) {
    const userId = request.user.id;

    // Check if user exists and doesn't already have a fan profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isDeleted: false },
      include: { fan: true },
    });

    if (!user) {
      throw new CustomError(ErrorCode.AccountNotFound);
    }

    if (user.fan) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Check username uniqueness
    const usernameExists = await this.prisma.fan.findFirst({
      where: { username: body.username },
    });

    if (usernameExists) {
      throw new CustomError(ErrorCode.UsernameAlreadyExists);
    }

    // Create fan profile
    const fan = await this.prisma.fan.create({
      data: {
        userId,
        username: body.username,
        ...(body.avatarUrl && { avatarUrl: body.avatarUrl }),
        ...(body.backgroundUrl && { backgroundUrl: body.backgroundUrl }),
        ...(body.bio && { bio: body.bio }),
      },
    });

    // Update user role to FAN if not already set
    if (user.role !== Role.FAN) {
      await this.prisma.user.update({
        where: { id: userId },
        data: { role: Role.FAN },
      });
    }

    return BaseResponse.of(fan);
  }

  async updateIdolProfile(body: UpdateIdolRequest, request: IRequest) {
    const userId = request.user.id;

    // Check if user is an idol
    const user = await this.prisma.user.findUnique({
      where: { id: userId, isDeleted: false, role: Role.IDOL },
      include: { idol: true },
    });

    if (!user) {
      throw new CustomError(ErrorCode.AccountNotFound);
    }

    if (!user.idol) {
      throw new CustomError(ErrorCode.IdolProfileNotFound);
    }

    // Update idol profile
    const updatedIdol = await this.prisma.idol.update({
      where: { id: user.idol.id },
      data: {
        ...(body.stageName && { stageName: body.stageName }),
        ...(body.avatarUrl !== undefined && { avatarUrl: body.avatarUrl }),
        ...(body.backgroundUrl !== undefined && { backgroundUrl: body.backgroundUrl }),
        ...(body.bio !== undefined && { bio: body.bio }),
      },
    });

    return BaseResponse.of(updatedIdol);
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
      data: { isOnline: status === UserStatus.ACTIVE ? true : false },
    });
    return BaseResponse.ok();
  }

  // Helper methods to format user data
  private formatUserData(user: any) {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      deviceToken: user.deviceToken,
      isOnline: user.isOnline,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(user.fan && { fan: user.fan }),
      ...(user.idol && { idol: user.idol }),
    };
  }

  private formatPublicUserData(user: any) {
    // Remove sensitive information like email and deviceToken
    return {
      id: user.id,
      role: user.role,
      isOnline: user.isOnline,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      ...(user.fan && { fan: user.fan }),
      ...(user.idol && { idol: user.idol }),
    };
  }
}