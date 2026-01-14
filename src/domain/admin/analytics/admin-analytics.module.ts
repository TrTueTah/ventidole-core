import { Module } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminAnalyticsController } from './admin-analytics.controller';
import { AdminAnalyticsService } from './admin-analytics.service';

@Module({
  controllers: [AdminAnalyticsController],
  providers: [AdminAnalyticsService, PrismaService],
  exports: [AdminAnalyticsService],
})
export class AdminAnalyticsModule {}
