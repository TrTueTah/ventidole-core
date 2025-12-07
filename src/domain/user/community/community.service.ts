import { Injectable } from '@nestjs/common';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CommunityDetailDto } from './dto/community-detail.dto';
import { CommunityListDto } from './dto/community-list.dto';
import { CommunityDto } from './dto/community.dto';
import { GetCommunitiesDto } from './dto/get-communities.dto';

@Injectable()
export class CommunityService {
  constructor(private readonly prisma: PrismaService) {}

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

    // Create follower relationship
    await this.prisma.communityFollower.create({
      data: {
        userId,
        communityId,
      },
    });
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
            userId,
            isDeleted: false,
          },
          select: {
            id: true,
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

    return {
      id: community.id,
      name: community.name,
      avatarUrl: community.avatarUrl,
      backgroundUrl: community.backgroundUrl,
      description: community.description,
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
      isJoined: community.followers.length > 0,
      idols: community.idols,
    };
  }
}
