import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IRequest } from '@shared/interface/request.interface';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { GetCommunitiesRequest, CommunityFilterType } from './request/get-communities.request';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { GetCommunitiesResponse } from './response/get-communities.response';
import { BaseResponse } from '@shared/helper/response';
import { GetCommunityDetailResponse } from './response/get-community-detail.response';

@Injectable()
export class CommunityService {
  constructor(private prisma: PrismaService) {}

  async getCommunities(query: GetCommunitiesRequest, request: IRequest) {
    const { page = 1, limit = 10, filter = CommunityFilterType.JOINED, search } = query;
    const userId = request.user.id;
    const skip = (page - 1) * limit;

    // Build search condition
    const searchCondition = search
      ? {
          name: {
            contains: search,
            mode: 'insensitive' as const,
          },
        }
      : {};

    if (filter === CommunityFilterType.JOINED) {
      // Get communities that user has joined, sorted by join time (most recent first)
      const [allCommunities, total] = await Promise.all([
        this.prisma.community.findMany({
          where: {
            isActive: true,
            isDeleted: false,
            ...searchCondition,
            followers: {
              some: {
                userId,
                isDeleted: false,
              },
            },
          },
          include: {
            followers: {
              where: { userId, isDeleted: false },
              select: {
                createdAt: true,
              },
            },
            _count: {
              select: {
                followers: {
                  where: { isDeleted: false },
                },
              },
            },
          },
        }),
        this.prisma.community.count({
          where: {
            isActive: true,
            isDeleted: false,
            ...searchCondition,
            followers: {
              some: { userId, isDeleted: false },
            },
          },
        }),
      ]);

      // Sort by join time (most recent first)
      const communitiesSorted = allCommunities.sort((a, b) => {
        const aTime = a.followers?.[0]?.createdAt?.getTime?.() ?? 0;
        const bTime = b.followers?.[0]?.createdAt?.getTime?.() ?? 0;
        return bTime - aTime;
      });

      const pagedCommunities = communitiesSorted.slice(skip, skip + limit);

      const paging: PageInfo = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      const communityDtos = pagedCommunities.map((c) => new GetCommunitiesResponse(c, true));

      return new PaginationResponse(communityDtos, paging);
    } else {
      // Get all communities with isJoin field
      const [communities, total] = await Promise.all([
        this.prisma.community.findMany({
          where: {
            isActive: true,
            isDeleted: false,
            ...searchCondition,
          },
          include: {
            followers: {
              where: { userId, isDeleted: false },
              select: {
                id: true,
              },
            },
            _count: {
              select: {
                followers: {
                  where: { isDeleted: false },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy: {
            createdAt: 'desc',
          },
        }),
        this.prisma.community.count({
          where: {
            isActive: true,
            isDeleted: false,
            ...searchCondition,
          },
        }),
      ]);

      const paging: PageInfo = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      const communityDtos = communities.map((c) => {
        const isJoin = c.followers.length > 0;
        return new GetCommunitiesResponse(c, isJoin);
      });

      return new PaginationResponse(communityDtos, paging);
    }
  }

  async joinCommunity(body: { communityId: string }, request: IRequest) {
    const userId = request.user.id;

    // Check if community exists and is active
    const community = await this.prisma.community.findFirst({
      where: {
        id: body.communityId,
        isActive: true,
        isDeleted: false,
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if user already has a membership record (active or deleted)
    const existingMembership = await this.prisma.communityFollower.findFirst({
      where: {
        communityId: body.communityId,
        userId: userId,
      },
    });

    if (existingMembership) {
      // If membership exists but is deleted, restore it
      if (existingMembership.isDeleted) {
        await this.prisma.communityFollower.update({
          where: {
            id: existingMembership.id,
          },
          data: {
            isDeleted: false,
            deletedAt: null,
          },
        });
        return { message: 'Successfully joined the community' };
      }
      // If membership exists and is active, user is already a member
      throw new BadRequestException('User is already a member of this community');
    }

    // Create new membership
    await this.prisma.communityFollower.create({
      data: {
        communityId: body.communityId,
        userId: userId,
      },
    });

    return { message: 'Successfully joined the community' };
  }

  async leaveCommunity(body: { communityId: string }, request: IRequest) {
    const userId = request.user.id;

    // Check if user is a member of the community
    const membership = await this.prisma.communityFollower.findFirst({
      where: {
        communityId: body.communityId,
        userId: userId,
        isDeleted: false,
      },
    });

    if (!membership) {
      throw new NotFoundException('User is not a member of this community');
    }

    // Soft delete the membership
    await this.prisma.communityFollower.update({
      where: {
        id: membership.id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { message: 'Successfully left the community' };
  }

  async getCommunityDetail(communityId: string, request: IRequest): Promise<BaseResponse<GetCommunityDetailResponse>> {
    const userId = request.user.id;

    // Get community with idol and follower information
    const community = await this.prisma.community.findFirst({
      where: {
        id: communityId,
        isActive: true,
        isDeleted: false,
      },
      include: {
        idols: {
          select: {
            id: true,
            stageName: true,
            avatarUrl: true,
            bio: true,
            userId: true,
          },
        },
        followers: {
          where: {
            isDeleted: false,
          },
          select: {
            userId: true,
          },
        },
        _count: {
          select: {
            followers: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    if (!community) {
      throw new NotFoundException('Community not found');
    }

    // Check if current user is following this community
    const isFollowing = community.followers.some(
      (follower) => follower.userId === userId,
    );

    const response: GetCommunityDetailResponse = {
      id: community.id,
      name: community.name,
      description: community.description ?? undefined,
      avatarUrl: community.avatarUrl ?? undefined,
      backgroundUrl: community.backgroundUrl ?? undefined,
      followerCount: community._count.followers,
      isFollowing,
      idols: community.idols.map((idol) => ({
        id: idol.id,
        userId: idol.userId,
        stageName: idol.stageName,
        bio: idol.bio ?? undefined,
        avatarUrl: idol.avatarUrl ?? undefined,
      })),
      createdAt: community.createdAt,
      updatedAt: community.updatedAt,
    };

    return BaseResponse.of(response);
  }
}
