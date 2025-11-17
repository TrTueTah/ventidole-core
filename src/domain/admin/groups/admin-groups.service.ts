import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { BaseResponse } from '@shared/helper/response';
import { CreateGroupRequest, GetGroupsRequest } from './request/index.request';
import { PageInfo, PaginationResponse } from '@shared/dto/pagination-response.dto';
import { GroupDto } from './response/get-groups.response';
import { CreateGroupResponse } from './response/create-group.response';

@Injectable()
export class AdminGroupsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Create a new group
   * Only accessible by ADMIN role
   */
  async createGroup(body: CreateGroupRequest) {
    // Check if group name already exists
    const existingGroup = await this.prisma.group.findFirst({
      where: { groupName: body.groupName },
    });

    if (existingGroup) {
      throw new CustomError(ErrorCode.ValidationFailed);
    }

    // Create group
    const group = await this.prisma.group.create({
      data: {
        groupName: body.groupName,
        description: body.description,
        logoUrl: body.logoUrl,
        backgroundUrl: body.backgroundUrl,
      },
    });

    const groupDto = new CreateGroupResponse(group);
    return BaseResponse.of(groupDto);
  }

  /**
   * Get all groups with pagination
   */
  async getAllGroups(query: GetGroupsRequest) {
    const { page, limit, sortBy = 'createdAt', sortOrder = 'desc' } = query;

    // Construct orderBy object
    const orderByObj: any = {};
    orderByObj[sortBy] = sortOrder;

    const [groups, total] = await Promise.all([
      this.prisma.group.findMany({
        where: { isActive: true },
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
      this.prisma.group.count({
        where: { isActive: true },
      }),
    ]);

    const paging: PageInfo = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    // Transform raw data to DTOs
    const groupDtos = groups.map(group => new GroupDto(group));

    return new PaginationResponse(groupDtos, paging);
  }
}