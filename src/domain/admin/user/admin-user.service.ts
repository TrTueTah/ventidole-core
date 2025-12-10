import { Injectable } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { hashPassword } from '@shared/helper/hash';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDetailDto } from './dto/user-detail.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class AdminUserService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllUsers(
    filters: GetUsersDto,
  ): Promise<PaginationResponse<UserDto>> {
    const { offset, limit, page, search, role, isActive, sortBy, sortOrder } =
      filters;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add role filter
    if (role) {
      whereClause.role = role;
    }

    // Add active status filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Build orderBy clause
    const orderByClause: Record<string, string> = {};
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'email',
      'username',
      'role',
    ];

    if (sortBy && validSortFields.includes(sortBy)) {
      orderByClause[sortBy] = sortOrder || 'desc';
    } else {
      orderByClause.createdAt = 'desc';
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          avatarUrl: true,
          backgroundUrl: true,
          bio: true,
          isActive: true,
          isOnline: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: orderByClause,
        skip: offset,
        take: limit,
      }),
      this.prisma.user.count({
        where: whereClause,
      }),
    ]);

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(users, pageInfo);
  }

  async getUserById(id: string): Promise<UserDetailDto> {
    const user = await this.prisma.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        backgroundUrl: true,
        bio: true,
        isActive: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
        communityId: true,
        community: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            backgroundUrl: true,
            description: true,
            followers: {
              where: {
                isDeleted: false,
                isActive: true,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new CustomError(ErrorCode.UserNotFound);
    }

    // For IDOL role, include community information
    if (user.role === 'IDOL' && user.community) {
      return {
        ...user,
        community: {
          id: user.community.id,
          name: user.community.name,
          avatarUrl: user.community.avatarUrl,
          backgroundUrl: user.community.backgroundUrl,
          description: user.community.description,
          totalMembers: user.community.followers.length,
        },
      };
    }

    // For FAN role, exclude community info
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { community, communityId, ...userWithoutCommunity } = user;
    return userWithoutCommunity;
  }

  async createUser(createUserDto: CreateUserDto): Promise<UserDetailDto> {
    // Check if email already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new CustomError(ErrorCode.EmailAlreadyExists);
    }

    const userRole = createUserDto.role || 'FAN';

    // For FAN role, communityId is required
    if (userRole === 'FAN') {
      if (!createUserDto.communityId) {
        throw new CustomError(ErrorCode.ValidationFailed);
      }

      // Verify community exists
      const community = await this.prisma.community.findFirst({
        where: {
          id: createUserDto.communityId,
          isDeleted: false,
          isActive: true,
        },
      });

      if (!community) {
        throw new CustomError(ErrorCode.CommunityNotFound);
      }
    }

    // Hash password
    const hashedPassword = await hashPassword(createUserDto.password);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: createUserDto.email,
        username: createUserDto.username,
        password: hashedPassword,
        role: userRole,
        avatarUrl: createUserDto.avatarUrl,
        backgroundUrl: createUserDto.backgroundUrl,
        bio: createUserDto.bio,
        communityId: createUserDto.communityId,
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        backgroundUrl: true,
        bio: true,
        isActive: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
        communityId: true,
        community: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            backgroundUrl: true,
            description: true,
            followers: {
              where: {
                isDeleted: false,
                isActive: true,
              },
              select: {
                id: true,
              },
            },
          },
        },
      },
    });

    // For IDOL role, include community information
    if (user.role === 'IDOL' && user.community) {
      return {
        ...user,
        community: {
          id: user.community.id,
          name: user.community.name,
          avatarUrl: user.community.avatarUrl,
          backgroundUrl: user.community.backgroundUrl,
          description: user.community.description,
          totalMembers: user.community.followers.length,
        },
      };
    }

    // For FAN role, exclude community info
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { community, communityId, ...userWithoutCommunity } = user;
    return userWithoutCommunity;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingUser) {
      throw new CustomError(ErrorCode.UserNotFound);
    }

    // Check if email is being updated and already exists
    if (updateUserDto.email && updateUserDto.email !== existingUser.email) {
      const emailExists = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (emailExists) {
        throw new CustomError(ErrorCode.EmailAlreadyExists);
      }
    }

    // Prepare update data
    const updateData: Record<string, unknown> = { ...updateUserDto };

    // Hash password if being updated
    if (updateUserDto.password) {
      updateData.password = await hashPassword(updateUserDto.password);
    }

    // Update user
    const user = await this.prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        avatarUrl: true,
        backgroundUrl: true,
        bio: true,
        isActive: true,
        isOnline: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async deleteUser(id: string): Promise<void> {
    // Check if user exists
    const existingUser = await this.prisma.user.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingUser) {
      throw new CustomError(ErrorCode.UserNotFound);
    }

    // Soft delete user
    await this.prisma.user.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
