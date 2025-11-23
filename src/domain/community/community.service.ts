import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { IRequest } from '@shared/interface/request.interface';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { GetCommunitiesRequest, CommunityFilterType } from './request/get-communities.request';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { GetCommunitiesResponse } from './response/get-communities.response';

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

    // Check if user already joined
    const existingMembership = await this.prisma.communityFollower.findFirst({
      where: {
        communityId: body.communityId,
        userId: userId,
        isDeleted: false,
      },
    });

    if (existingMembership) {
      throw new BadRequestException('User is already a member of this community');
    }

    // Add user to community
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
}
