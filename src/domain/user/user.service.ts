import { Injectable } from '@nestjs/common';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { UpdateStatusDto } from './dto/update-status.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

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
}
