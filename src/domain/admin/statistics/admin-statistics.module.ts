import { Module } from '@nestjs/common';
import { AdminStatisticsController } from './admin-statistics.controller';
import { AdminStatisticsService } from './admin-statistics.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';

@Module({
  controllers: [AdminStatisticsController],
  providers: [AdminStatisticsService, PrismaService],
  exports: [AdminStatisticsService],
})
export class AdminStatisticsModule {}