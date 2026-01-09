import { StreamChatService } from '@domain/stream-chat/stream-chat.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminCommunityDetailDto } from './dto/community-detail.dto';
import { CommunityDto } from './dto/community.dto';
import { CreateCommunityDto } from './dto/create-community.dto';
import { GetCommunitiesDto } from './dto/get-communities.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@Injectable()
export class AdminCommunityService {
  private readonly logger = new Logger(AdminCommunityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly streamChatService: StreamChatService,
  ) {}

  async getAllCommunities(
    filters: GetCommunitiesDto,
  ): Promise<PaginationResponse<CommunityDto>> {
    const { offset, limit, page, search, isActive, sortBy, sortOrder } =
      filters;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add active status filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Build orderBy clause
    const orderByClause: Record<string, string> = {};
    const validSortFields = ['createdAt', 'updatedAt', 'name'];

    if (sortBy && validSortFields.includes(sortBy)) {
      orderByClause[sortBy] = sortOrder || 'desc';
    } else {
      orderByClause.createdAt = 'desc';
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
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: orderByClause,
        skip: offset,
        take: limit,
      }),
      this.prisma.community.count({
        where: whereClause,
      }),
    ]);

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(communities, pageInfo);
  }

  async getCommunityById(id: string): Promise<AdminCommunityDetailDto> {
    const community = await this.prisma.community.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        backgroundUrl: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        followers: {
          where: {
            isDeleted: false,
            isActive: true,
          },
          select: {
            id: true,
          },
        },
        posts: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
          },
        },
      },
    });

    if (!community) {
      throw new CustomError(ErrorCode.CommunityNotFound);
    }

    return {
      ...community,
      totalMembers: community.followers.length,
      totalPosts: community.posts.length,
    };
  }

  async createCommunity(
    createCommunityDto: CreateCommunityDto,
    adminId?: string,
  ): Promise<CommunityDto> {
    const community = await this.prisma.community.create({
      data: {
        name: createCommunityDto.name,
        avatarUrl: createCommunityDto.avatarUrl,
        backgroundUrl: createCommunityDto.backgroundUrl,
        description: createCommunityDto.description,
        communityType: createCommunityDto.communityType,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        backgroundUrl: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Create GetStream channel for the community
    if (adminId) {
      try {
        await this.streamChatService.createCommunityChannel(adminId, {
          communityId: community.id,
          name: `${community.name} Community`,
          description: community.description || undefined,
          image: community.avatarUrl || undefined,
        });
        this.logger.log(
          `Created GetStream channel for community: ${community.id}`,
        );
      } catch (error) {
        this.logger.error(
          `Failed to create GetStream channel for community ${community.id}:`,
          error,
        );
        // Non-blocking: Don't fail community creation if GetStream fails
      }
    } else {
      this.logger.warn(
        `No adminId provided - skipping GetStream channel creation for community ${community.id}`,
      );
    }

    return community;
  }

  async updateCommunity(
    id: string,
    updateCommunityDto: UpdateCommunityDto,
  ): Promise<CommunityDto> {
    // Check if community exists
    const existingCommunity = await this.prisma.community.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingCommunity) {
      throw new CustomError(ErrorCode.CommunityNotFound);
    }

    // Update community
    const community = await this.prisma.community.update({
      where: { id },
      data: updateCommunityDto,
      select: {
        id: true,
        name: true,
        avatarUrl: true,
        backgroundUrl: true,
        description: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return community;
  }

  async deleteCommunity(id: string): Promise<void> {
    // Check if community exists
    const existingCommunity = await this.prisma.community.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingCommunity) {
      throw new CustomError(ErrorCode.CommunityNotFound);
    }

    // Soft delete community
    await this.prisma.community.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
