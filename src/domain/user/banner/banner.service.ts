import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { UserBannerDto } from './dto/banner.dto';

@Injectable()
export class BannerService {
  constructor(private readonly prisma: PrismaService) {}

  async getActiveBanners(): Promise<UserBannerDto[]> {
    const now = new Date();

    const banners = await this.prisma.banner.findMany({
      where: {
        isDeleted: false,
        isActive: true,
        startDate: {
          lte: now,
        },
        endDate: {
          gte: now,
        },
      },
      orderBy: [{ order: 'asc' }, { createdAt: 'desc' }],
      select: {
        id: true,
        title: true,
        description: true,
        imageUrl: true,
        link: true,
        startDate: true,
        endDate: true,
        order: true,
      },
    });

    return banners as UserBannerDto[];
  }
}
