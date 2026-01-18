import { StreamChatService } from '@domain/stream-chat/stream-chat.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { hashPassword } from '@shared/helper/hash';
import { GetStreamNotificationService } from '@shared/service/getstream-notification/getstream-notification.service';
import { KnockUserService } from '@shared/service/knock-workflow/knock-user.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { UserModel } from 'src/db/prisma/models';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDetailDto } from './dto/user-detail.dto';
import { UserDto } from './dto/user.dto';

@Injectable()
export class AdminUserService {
  private readonly logger = new Logger(AdminUserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly getStreamNotificationService: GetStreamNotificationService,
    private readonly knockUserService: KnockUserService,
    private readonly streamChatService: StreamChatService,
  ) {}

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

    // For IDOL role, communityId is required
    if (userRole === 'IDOL') {
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

    // Initialize notification and messaging infrastructure for new user
    await this.initializeUserMessaging(user);

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

  /**
   * Initialize messaging and notification infrastructure for a new user
   * Creates GetStream chat user, notification channel, and registers in Knock
   * For FAN users: Also adds them to their community channel with channel_moderator role
   */
  private async initializeUserMessaging(user: UserModel): Promise<void> {
    try {
      this.logger.log(
        `Initializing messaging infrastructure for user ${user.id}`,
      );

      // 1. Create user in GetStream Chat FIRST (required for notification channel)
      await this.streamChatService.createOrUpdateUser({
        userId: user.id,
        name: user.username,
        image: user.avatarUrl,
      });

      // 2. Create GetStream notification channel for real-time events
      await this.getStreamNotificationService.createNotificationChannel(
        user.id,
      );

      // 3. Register user in Knock for multi-channel notifications
      await this.knockUserService.registerUser({
        userId: user.id,
        email: user.email,
        name: user.username,
        avatarUrl: user.avatarUrl,
        role: user.role,
      });

      // 4. For FAN users: Add them to their community channel with channel_moderator role
      if (user.role === 'FAN' && user.communityId) {
        const result = await this.streamChatService.addUserToCommunityChannel(
          user.id,
          user.communityId,
          'channel_moderator',
        );

        if (result) {
          this.logger.log(
            `Added FAN user ${user.id} to community channel ${result.channelId} with role ${result.channelRole}`,
          );
        } else {
          this.logger.warn(
            `Could not add FAN user ${user.id} to community channel - channel may not exist yet`,
          );
        }
      }

      this.logger.log(
        `Successfully initialized messaging infrastructure for user ${user.id}`,
      );
    } catch (error) {
      this.logger.error(
        `Error initializing messaging for user ${user.id}:`,
        error.message,
      );
      // Don't throw - messaging initialization failure shouldn't block user creation
    }
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

    // Update user in GetStream and Knock if relevant fields changed
    if (
      updateUserDto.username ||
      updateUserDto.avatarUrl ||
      updateUserDto.email
    ) {
      // Update GetStream Chat user
      try {
        await this.streamChatService.createOrUpdateUser({
          userId: user.id,
          name: user.username,
          image: user.avatarUrl,
        });
        this.logger.log(`Updated user ${user.id} in GetStream Chat`);
      } catch (error) {
        this.logger.error(
          `Failed to update user ${user.id} in GetStream:`,
          error.message,
        );
        // Non-blocking: Don't fail user update if GetStream fails
      }

      // Update Knock user
      try {
        await this.knockUserService.registerUser({
          userId: user.id,
          email: user.email,
          name: user.username,
          avatarUrl: user.avatarUrl,
          role: user.role,
        });
        this.logger.log(`Updated user ${user.id} in Knock`);
      } catch (error) {
        this.logger.error(
          `Failed to update user ${user.id} in Knock:`,
          error.message,
        );
        // Non-blocking: Don't fail user update if Knock fails
      }
    }

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
