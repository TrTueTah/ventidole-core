import { Injectable } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { BannerDetailDto } from './dto/banner-detail.dto';
import { BannerDto } from './dto/banner.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { GetBannersDto } from './dto/get-banners.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class AdminBannerService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllBanners(
    filters: GetBannersDto,
  ): Promise<PaginationResponse<BannerDto>> {
    const { page = 1, limit = 10, search, isActive } = filters;
    const offset = (page - 1) * limit;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Add active filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    // Get total count
    const total = await this.prisma.banner.count({ where: whereClause });

    // Get banners
    const banners = await this.prisma.banner.findMany({
      where: whereClause,
      skip: offset,
      take: limit,
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
    });

    const pageInfo: PageInfo = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return {
      data: banners as BannerDto[],
      pageInfo,
    };
  }

  async getBannerById(id: string): Promise<BannerDetailDto> {
    const banner = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!banner) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Banner not found');
    }

    return banner as BannerDetailDto;
  }

  async createBanner(data: CreateBannerDto): Promise<BannerDetailDto> {
    // Validate dates
    const startDate = new Date(data.startDate);
    const endDate = new Date(data.endDate);

    if (startDate >= endDate) {
      throw new CustomError(
        ErrorCode.BAD_REQUEST,
        'Start date must be before end date',
      );
    }

    const banner = await this.prisma.banner.create({
      data: {
        title: data.title,
        description: data.description,
        imageUrl: data.imageUrl,
        link: data.link,
        startDate,
        endDate,
        order: data.order ?? 0,
      },
    });

    return banner as BannerDetailDto;
  }

  async updateBanner(
    id: string,
    data: UpdateBannerDto,
  ): Promise<BannerDetailDto> {
    // Check if banner exists
    const existingBanner = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Banner not found');
    }

    // Validate dates if provided
    if (data.startDate || data.endDate) {
      const startDate = data.startDate
        ? new Date(data.startDate)
        : existingBanner.startDate;
      const endDate = data.endDate
        ? new Date(data.endDate)
        : existingBanner.endDate;

      if (startDate >= endDate) {
        throw new CustomError(
          ErrorCode.BAD_REQUEST,
          'Start date must be before end date',
        );
      }
    }

    const updateData: Record<string, unknown> = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.link !== undefined) updateData.link = data.link;
    if (data.startDate !== undefined)
      updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const banner = await this.prisma.banner.update({
      where: { id },
      data: updateData,
    });

    return banner as BannerDetailDto;
  }

  async deleteBanner(id: string): Promise<void> {
    // Check if banner exists
    const existingBanner = await this.prisma.banner.findUnique({
      where: { id },
    });

    if (!existingBanner) {
      throw new CustomError(ErrorCode.NOT_FOUND, 'Banner not found');
    }

    // Soft delete
    await this.prisma.banner.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
