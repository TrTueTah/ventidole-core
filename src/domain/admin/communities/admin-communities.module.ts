import { Module } from '@nestjs/common';
import { AdminCommunitiesController } from './admin-communities.controller';
import { AdminCommunitiesService } from './admin-communities.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';

@Module({
  controllers: [AdminCommunitiesController],
  providers: [AdminCommunitiesService, PrismaService],
  exports: [AdminCommunitiesService],
})
export class AdminCommunitiesModule {}