import { Module } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminBannerController } from './admin-banner.controller';
import { AdminBannerService } from './admin-banner.service';

@Module({
  controllers: [AdminBannerController],
  providers: [AdminBannerService, PrismaService],
  exports: [AdminBannerService],
})
export class AdminBannerModule {}
