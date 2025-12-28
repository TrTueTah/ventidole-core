import { StreamChatService } from '@domain/stream-chat/stream-chat.service';
import { Injectable, Logger } from '@nestjs/common';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { UpdateProfileResponseDto } from './dto/update-profile-response.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly streamChatService: StreamChatService,
  ) {}

  async getCurrentUser(userId: string): Promise<UserDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        backgroundUrl: true,
        bio: true,
        communityId: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new CustomError(ErrorCode.UserNotFound);
    }

    return {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      avatarUrl: user.avatarUrl ?? undefined,
      backgroundUrl: user.backgroundUrl ?? undefined,
      bio: user.bio ?? undefined,
      communityId: user.communityId ?? undefined,
      isOnline: user.isOnline,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  async updateStatus(
    userId: string,
    updateStatusDto: UpdateStatusDto,
  ): Promise<UserDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!user) {
      throw new CustomError(ErrorCode.UserNotFound);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        isOnline: updateStatusDto.isOnline,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        backgroundUrl: true,
        bio: true,
        communityId: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatarUrl ?? undefined,
      backgroundUrl: updatedUser.backgroundUrl ?? undefined,
      bio: updatedUser.bio ?? undefined,
      communityId: updatedUser.communityId ?? undefined,
      isOnline: updatedUser.isOnline,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    };
  }

  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    const user = await this.prisma.user.findFirst({
      where: {
        id: userId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!user) {
      throw new CustomError(ErrorCode.UserNotFound);
    }

    // Check username uniqueness if username is being updated
    if (
      updateProfileDto.username &&
      updateProfileDto.username !== user.username
    ) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: updateProfileDto.username,
          isActive: true,
          isDeleted: false,
          id: { not: userId },
        },
      });
      if (existingUser) throw new CustomError(ErrorCode.ExistedUsername);
    }

    // Update user profile
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        username: updateProfileDto.username,
        avatarUrl: updateProfileDto.avatarUrl,
        backgroundUrl: updateProfileDto.backgroundUrl,
        bio: updateProfileDto.bio,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        backgroundUrl: true,
        bio: true,
      },
    });

    // Sync with Stream Chat
    try {
      await this.streamChatService.createOrUpdateUser({
        userId: updatedUser.id,
        name: updatedUser.username,
        image: updatedUser.avatarUrl ?? undefined,
      });
      this.logger.log(
        `Successfully synced profile update to Stream Chat for user ${userId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to sync profile update to Stream Chat for user ${userId}:`,
        error.message,
      );
      // Don't throw - Stream Chat sync failure shouldn't block profile update
    }

    return {
      id: updatedUser.id,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      avatarUrl: updatedUser.avatarUrl ?? undefined,
      backgroundUrl: updatedUser.backgroundUrl ?? undefined,
      bio: updatedUser.bio ?? undefined,
    };
  }
}
