import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { BaseResponse } from '@shared/helper/response';
import { CreateCommunityRequest, GetCommunitiesRequest } from './request/index.request';
import { PageInfo, PaginationResponse } from '@shared/dto/pagination-response.dto';
import { CommunityDto } from './response/get-communities.response';
import { CreateCommunityResponse } from './response/create-community.response';

@Injectable()
export class AdminCommunitiesService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new community
   * Only accessible by ADMIN role
   */
  async createCommunity(body: CreateCommunityRequest) {
    // Check if community name already exists
    const existingCommunity = await this.prisma.community.findFirst({
      where: { name: body.name },
    });

    if (existingCommunity) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Create community
    const community = await this.prisma.community.create({
      data: {
        name: body.name,
        description: body.description,
        avatarUrl: body.avatarUrl,
        backgroundUrl: body.backgroundUrl,
      },
    });

    const communityDto = new CreateCommunityResponse(community);
    return BaseResponse.of(communityDto);
  }

  /**
   * Get all communities with pagination
   */
  async getAllCommunities(query: GetCommunitiesRequest) {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // Construct orderBy object
    const orderByObj: any = {};
    orderByObj[sortBy] = sortOrder;

    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where: { isActive: true, isDeleted: false },
        include: {
          idols: {
            where: { isActive: true },
            select: {
              id: true,
              stageName: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              idols: true,
              followers: true,
            },
          },
        },
        orderBy: orderByObj,
        skip: query.offset,
        take: limit,
      }),
      this.prisma.community.count({
        where: { isActive: true, isDeleted: false },
      }),
    ]);

    const paging: PageInfo = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Transform raw data to DTOs
    const communityDtos = communities.map(community => new CommunityDto(community));

    return new PaginationResponse(communityDtos, paging);
  }
}