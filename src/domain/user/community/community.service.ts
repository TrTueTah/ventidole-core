import getStreamChatClient from '@core/config/stream-chat.config';
import { StreamChatService } from '@domain/stream-chat/stream-chat.service';
import { Injectable, Logger } from '@nestjs/common';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { GetStreamNotificationService } from '@shared/service/getstream-notification/getstream-notification.service';
import { KnockWorkflowService } from '@shared/service/knock-workflow/knock-workflow.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CommunityDetailDto } from './dto/community-detail.dto';
import { CommunityListDto } from './dto/community-list.dto';
import { CommunityDto } from './dto/community.dto';
import { GetCommunitiesDto } from './dto/get-communities.dto';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knockWorkflowService: KnockWorkflowService,
    private readonly getStreamNotificationService: GetStreamNotificationService,
    private readonly streamChatService: StreamChatService,
  ) {}

  async getAllCommunities(
    userId: string,
    filters: GetCommunitiesDto,
  ): Promise<PaginationResponse<CommunityListDto>> {
    const { offset, limit, page, search, joined } = filters;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
      isActive: true,
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add joined filter
    if (joined === 'true') {
      whereClause.followers = {
        some: {
          userId,
          isDeleted: false,
          isActive: true,
        },
      };
    }

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          avatarUrl: true,
          backgroundUrl: true,
          description: true,
          createdAt: true,
          updatedAt: true,
          followers: {
            where: {
              isDeleted: false,
              isActive: true,
            },
            select: {
              id: true,
              userId: true,
            },
          },
          idols: {
            where: {
              isDeleted: false,
              isActive: true,
            },
            select: {
              id: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.community.count({
        where: whereClause,
      }),
    ]);

    const transformedCommunities = communities.map((community) => ({
      id: community.id,
      name: community.name,
      avatarUrl: community.avatarUrl,
      backgroundUrl: community.backgroundUrl,
      description: community.description,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      isJoined: community.followers.some((f) => f.userId === userId),
      totalMember: community.followers.length,
      totalIdol: community.idols.length,
      isNew:
        new Date().getTime() - community.createdAt.getTime() <
        7 * 24 * 60 * 60 * 1000,
    }));

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(transformedCommunities, pageInfo);
  }

  async getJoinedCommunities(
    userId: string,
    pagination: PaginationDto,
  ): Promise<PaginationResponse<CommunityDto>> {
    const { offset, limit, page } = pagination;

    const [followers, total] = await Promise.all([
      this.prisma.communityFollower.findMany({
        where: {
          userId,
          isDeleted: false,
          isActive: true,
          community: {
            isDeleted: false,
            isActive: true,
          },
        },
        select: {
          community: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
              backgroundUrl: true,
              description: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.communityFollower.count({
        where: {
          userId,
          isDeleted: false,
          isActive: true,
          community: {
            isDeleted: false,
            isActive: true,
          },
        },
      }),
    ]);

    const transformedCommunities = followers.map((follower) => ({
      id: follower.community.id,
      name: follower.community.name,
      avatarUrl: follower.community.avatarUrl,
      backgroundUrl: follower.community.backgroundUrl,
      description: follower.community.description,
      createdAt: follower.community.createdAt,
      updatedAt: follower.community.updatedAt,
      isJoined: true,
    }));

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(transformedCommunities, pageInfo);
  }

  async joinCommunity(userId: string, communityId: string): Promise<void> {
    // Check if community exists and get idol info
    const community = await this.prisma.community.findFirst({
      where: {
        id: communityId,
        isDeleted: false,
        isActive: true,
      },
      include: {
        idols: {
          where: {
            isDeleted: false,
            isActive: true,
          },
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
          take: 1, // Get first idol
        },
      },
    });

    if (!community) {
      throw new CustomError(ErrorCode.CommunityNotFound);
    }

    // Check if already joined
    const existingFollower = await this.prisma.communityFollower.findFirst({
      where: {
        userId,
        communityId,
        isDeleted: false,
      },
    });

    if (existingFollower) {
      throw new CustomError(ErrorCode.AlreadyJoinedCommunity);
    }

    // Get fan info for notifications
    const fan = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    if (!fan) {
      throw new CustomError(ErrorCode.UserNotFound);
    }

    // Create follower relationship
    await this.prisma.communityFollower.create({
      data: {
        userId,
        communityId,
      },
    });

    this.logger.log(`User ${userId} joined community ${communityId}`);

    // Add fan to community channels in GetStream
    await this.addFanToCommunityChannels(userId, communityId);

    // Join community chat channel
    await this.joinCommunityChatChannel(userId, communityId);

    // Notify idol(s) about new follower
    if (community.idols && community.idols.length > 0) {
      await this.notifyIdolsAboutNewFollower(community.idols, fan, community);
    }
  }

  async bulkFollowCommunities(
    userId: string,
    communityIds: string[],
  ): Promise<void> {
    // Get fan info for notifications
    const fan = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    if (!fan) {
      throw new CustomError(ErrorCode.UserNotFound);
    }

    // Get all valid communities that exist and are active
    const communities = await this.prisma.community.findMany({
      where: {
        id: { in: communityIds },
        isDeleted: false,
        isActive: true,
      },
      include: {
        idols: {
          where: {
            isDeleted: false,
            isActive: true,
          },
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
          take: 1,
        },
      },
    });

    if (communities.length === 0) {
      throw new CustomError(ErrorCode.CommunityNotFound);
    }

    // Get existing followers to avoid duplicates
    const existingFollowers = await this.prisma.communityFollower.findMany({
      where: {
        userId,
        communityId: { in: communityIds },
        isDeleted: false,
      },
      select: {
        communityId: true,
      },
    });

    const existingCommunityIds = new Set(
      existingFollowers.map((f) => f.communityId),
    );

    // Filter out communities already followed
    const communitiesToFollow = communities.filter(
      (c) => !existingCommunityIds.has(c.id),
    );

    if (communitiesToFollow.length === 0) {
      this.logger.log(
        `User ${userId} already follows all specified communities`,
      );
      return;
    }

    // Create follower relationships in bulk
    await this.prisma.communityFollower.createMany({
      data: communitiesToFollow.map((community) => ({
        userId,
        communityId: community.id,
      })),
      skipDuplicates: true,
    });

    // Update user's isChooseCommunity flag to true
    await this.prisma.user.update({
      where: { id: userId },
      data: { isChooseCommunity: true },
    });

    this.logger.log(
      `User ${userId} bulk followed ${communitiesToFollow.length} communities`,
    );

    // Process each community asynchronously for channels and notifications
    for (const community of communitiesToFollow) {
      // Add fan to community channels (don't await - let it run async)
      this.addFanToCommunityChannels(userId, community.id).catch((error) => {
        this.logger.error(
          `Error adding fan to channels for community ${community.id}:`,
          error.message,
        );
      });

      // Join community chat channel (don't await - let it run async)
      this.joinCommunityChatChannel(userId, community.id).catch((error) => {
        this.logger.error(
          `Error joining community chat channel for community ${community.id}:`,
          error.message,
        );
      });

      // Notify idol(s) about new follower (don't await - let it run async)
      if (community.idols && community.idols.length > 0) {
        this.notifyIdolsAboutNewFollower(community.idols, fan, community).catch(
          (error) => {
            this.logger.error(
              `Error notifying idols for community ${community.id}:`,
              error.message,
            );
          },
        );
      }
    }
  }

  /**
   * Add fan to all community channels in GetStream
   */
  private async addFanToCommunityChannels(
    fanId: string,
    communityId: string,
  ): Promise<void> {
    try {
      // Get all community channels
      const communityChannels = await this.prisma.chatChannel.findMany({
        where: {
          communityId,
          isCommunityChannel: true,
          isDeleted: false,
        },
        select: {
          id: true,
          type: true,
          name: true,
        },
      });

      if (communityChannels.length === 0) {
        this.logger.log(
          `No community channels found for community ${communityId}`,
        );
        return;
      }

      // Add fan to each channel in GetStream and database
      const streamChatClient = getStreamChatClient();

      for (const channel of communityChannels) {
        try {
          // Add to GetStream
          const streamChannel = streamChatClient.channel(
            channel.type,
            channel.id,
          );
          await streamChannel.addMembers([fanId]);

          // Add to database
          await this.prisma.chatParticipant.upsert({
            where: {
              channelId_userId: {
                channelId: channel.id,
                userId: fanId,
              },
            },
            create: {
              channelId: channel.id,
              userId: fanId,
              role: 'member',
              canSendMessage: true,
            },
            update: {
              isDeleted: false,
            },
          });

          this.logger.log(
            `Added fan ${fanId} to community channel ${channel.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Error adding fan to channel ${channel.id}:`,
            error.message,
          );
          // Continue with other channels even if one fails
        }
      }
    } catch (error) {
      this.logger.error(
        `Error adding fan to community channels:`,
        error.message,
      );
      // Don't throw - channel addition failure shouldn't block community join
    }
  }

  /**
   * Notify idol(s) about new follower via Knock and GetStream
   */
  private async notifyIdolsAboutNewFollower(
    idols: Array<{ id: string; username: string; avatarUrl: string | null }>,
    fan: { id: string; username: string; avatarUrl: string | null },
    community: { id: string; name: string },
  ): Promise<void> {
    for (const idol of idols) {
      try {
        // Send Knock notification (push/email)
        await this.knockWorkflowService.notifyCommunityJoined({
          idolId: idol.id,
          fan: {
            id: fan.id,
            name: fan.username,
            avatar: fan.avatarUrl ?? undefined,
          },
          communityId: community.id,
          communityName: community.name,
        });

        // Send real-time event via GetStream notification channel
        await this.getStreamNotificationService.emitCommunityJoinedEvent({
          idolId: idol.id,
          fanName: fan.username,
          communityId: community.id,
          communityName: community.name,
        });

        this.logger.log(
          `Notified idol ${idol.id} about new follower ${fan.id}`,
        );
      } catch (error) {
        this.logger.error(`Error notifying idol ${idol.id}:`, error.message);
        // Continue with other idols even if one fails
      }
    }
  }

  async leaveCommunity(userId: string, communityId: string): Promise<void> {
    // Check if community exists
    const community = await this.prisma.community.findFirst({
      where: {
        id: communityId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!community) {
      throw new CustomError(ErrorCode.CommunityNotFound);
    }

    // Check if user has joined
    const follower = await this.prisma.communityFollower.findFirst({
      where: {
        userId,
        communityId,
        isDeleted: false,
      },
    });

    if (!follower) {
      throw new CustomError(ErrorCode.NotJoinedCommunity);
    }

    // Soft delete the follower relationship
    await this.prisma.communityFollower.delete({
      where: { id: follower.id, userId: userId },
    });

    this.logger.log(`User ${userId} left community ${communityId}`);

    // Remove fan from community channels in GetStream
    await this.removeFanFromCommunityChannels(userId, communityId);

    // Leave community chat channel
    await this.leaveCommunityChatChannel(userId, communityId);
  }

  async getDetailCommunity(
    userId: string,
    communityId: string,
  ): Promise<CommunityDetailDto> {
    const community = await this.prisma.community.findFirst({
      where: {
        id: communityId,
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        backgroundUrl: true,
        description: true,
        createdAt: true,
        updatedAt: true,
        followers: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            userId: true,
          },
        },
        idols: {
          where: {
            isDeleted: false,
            isActive: true,
          },
          select: {
            id: true,
            username: true,
            avatarUrl: true,
            bio: true,
          },
        },
      },
    });

    if (!community) {
      throw new CustomError(ErrorCode.CommunityNotFound);
    }

    // Fetch channel information from GetStream
    const channelId = `community_${communityId}`;
    const chatChannel = await this.streamChatService.getChannelInfo(channelId);

    return {
      id: community.id,
      name: community.name,
      avatarUrl: community.avatarUrl,
      backgroundUrl: community.backgroundUrl,
      description: community.description,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      isJoined: community.followers.some((f) => f.userId === userId),
      totalMember: community.followers.length,
      totalIdol: community.idols.length,
      idols: community.idols,
      chatChannel: chatChannel ?? undefined,
    };
  }

  /**
   * Join community chat channel
   */
  private async joinCommunityChatChannel(
    userId: string,
    communityId: string,
  ): Promise<void> {
    try {
      // Generate the community channel ID
      const channelId = `community_${communityId}`;

      // Use StreamChatService to join the channel
      await this.streamChatService.joinChannel(userId, channelId);

      this.logger.log(
        `User ${userId} joined community chat channel ${channelId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error joining community chat channel for user ${userId}:`,
        error.message,
      );
      // Don't throw - channel join failure shouldn't block community join
    }
  }

  /**
   * Leave community chat channel
   */
  private async leaveCommunityChatChannel(
    userId: string,
    communityId: string,
  ): Promise<void> {
    try {
      // Generate the community channel ID
      const channelId = `community_${communityId}`;

      // Use GetStream client to remove member from channel
      const streamChatClient = getStreamChatClient();
      const channel = streamChatClient.channel('messaging', channelId);

      // Remove user from channel
      await channel.removeMembers([userId]);

      this.logger.log(
        `User ${userId} left community chat channel ${channelId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error leaving community chat channel for user ${userId}:`,
        error.message,
      );
      // Don't throw - channel leave failure shouldn't block community leave
    }
  }

  /**
   * Remove fan from all community channels in GetStream
   */
  private async removeFanFromCommunityChannels(
    fanId: string,
    communityId: string,
  ): Promise<void> {
    try {
      // Get all community channels
      const communityChannels = await this.prisma.chatChannel.findMany({
        where: {
          communityId,
          isCommunityChannel: true,
          isDeleted: false,
        },
        select: {
          id: true,
          type: true,
          name: true,
        },
      });

      if (communityChannels.length === 0) {
        this.logger.log(
          `No community channels found for community ${communityId}`,
        );
        return;
      }

      // Remove fan from each channel in GetStream and database
      const streamChatClient = getStreamChatClient();

      for (const channel of communityChannels) {
        try {
          // Remove from GetStream
          const streamChannel = streamChatClient.channel(
            channel.type,
            channel.id,
          );
          await streamChannel.removeMembers([fanId]);

          // Remove from database (soft delete)
          await this.prisma.chatParticipant.updateMany({
            where: {
              channelId: channel.id,
              userId: fanId,
            },
            data: {
              isDeleted: true,
            },
          });

          this.logger.log(
            `Removed fan ${fanId} from community channel ${channel.id}`,
          );
        } catch (error) {
          this.logger.error(
            `Error removing fan from channel ${channel.id}:`,
            error.message,
          );
          // Continue with other channels even if one fails
        }
      }
    } catch (error) {
      this.logger.error(
        `Error removing fan from community channels:`,
        error.message,
      );
      // Don't throw - channel removal failure shouldn't block community leave
    }
  }
}
