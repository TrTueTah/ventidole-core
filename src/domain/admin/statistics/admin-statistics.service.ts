import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { BaseResponse } from '@shared/helper/response';
import { Role } from 'src/db/prisma/enums';

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
      this.prisma.user.count({ where: { role: Role.FAN, isActive: true } }),
      this.prisma.user.count({ where: { role: Role.IDOL, isActive: true } }),
      this.prisma.community.count({ where: { isActive: true } }),
      this.prisma.user.count({ where: { isDeleted: false } }),
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