import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { BaseResponse } from '@shared/helper/response';

@Injectable()
export class AdminStatisticsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Get platform statistics
   */
  async getStatistics() {
    const [totalUsers, totalFans, totalIdols, totalGroups, onlineUsers] = await Promise.all([
      this.prisma.user.count({ where: { isDeleted: false } }),
      this.prisma.fan.count({ where: { isActive: true } }),
      this.prisma.idol.count({ where: { isActive: true } }),
      this.prisma.group.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isOnline: true, isDeleted: false } }),
    ]);

    return BaseResponse.of({
      totalUsers,
      totalFans,
      totalIdols,
      totalGroups,
      onlineUsers,
    });
  }
}