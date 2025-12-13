import { Injectable } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { GetShopsDto } from './dto/get-shops.dto';
import { ShopDetailDto } from './dto/shop-detail.dto';
import { ShopDto } from './dto/shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@Injectable()
export class AdminShopService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllShops(
    filters: GetShopsDto,
  ): Promise<PaginationResponse<ShopDto>> {
    const {
      offset,
      limit,
      page,
      search,
      communityId,
      isActive,
      sortBy,
      sortOrder,
    } = filters;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
    };

    // Add search filter
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    // Add community filter
    if (communityId) {
      whereClause.communityId = communityId;
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

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          avatarUrl: true,
          community: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: orderByClause,
        skip: offset,
        take: limit,
      }),
      this.prisma.shop.count({
        where: whereClause,
      }),
    ]);

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(shops, pageInfo);
  }

  async getShopById(id: string): Promise<ShopDetailDto> {
    const shop = await this.prisma.shop.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        communityId: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        version: true,
        metadata: true,
        community: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
            backgroundUrl: true,
            description: true,
          },
        },
      },
    });

    if (!shop) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Shop not found',
      });
    }

    return {
      ...shop,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: shop.metadata as Record<string, any> | null,
    };
  }

  async createShop(createShopDto: CreateShopDto): Promise<ShopDto> {
    // Verify community exists
    const community = await this.prisma.community.findUnique({
      where: {
        id: createShopDto.communityId,
      },
      select: {
        id: true,
        isDeleted: true,
        isActive: true,
      },
    });

    if (!community || community.isDeleted || !community.isActive) {
      throw new CustomError(ErrorCode.CommunityNotFound);
    }

    // Check if community already has a shop
    const existingShop = await this.prisma.shop.findFirst({
      where: {
        communityId: createShopDto.communityId,
        isDeleted: false,
      },
    });

    if (existingShop) {
      throw new CustomError(ErrorCode.ValidationFailed, {
        message: 'Community already has a shop',
      });
    }

    const shop = await this.prisma.shop.create({
      data: {
        name: createShopDto.name,
        description: createShopDto.description,
        avatarUrl: createShopDto.avatarUrl,
        communityId: createShopDto.communityId,
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        community: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return shop;
  }

  async updateShop(id: string, updateShopDto: UpdateShopDto): Promise<ShopDto> {
    // Check if shop exists
    const existingShop = await this.prisma.shop.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingShop) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Shop not found',
      });
    }

    const shop = await this.prisma.shop.update({
      where: {
        id,
      },
      data: {
        ...(updateShopDto.name && { name: updateShopDto.name }),
        ...(updateShopDto.description !== undefined && {
          description: updateShopDto.description,
        }),
        ...(updateShopDto.avatarUrl !== undefined && {
          avatarUrl: updateShopDto.avatarUrl,
        }),
        ...(updateShopDto.isActive !== undefined && {
          isActive: updateShopDto.isActive,
        }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        avatarUrl: true,
        community: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return shop;
  }

  async deleteShop(id: string): Promise<void> {
    // Check if shop exists
    const existingShop = await this.prisma.shop.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingShop) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Shop not found',
      });
    }

    // Soft delete
    await this.prisma.shop.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
