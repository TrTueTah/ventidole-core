import { Module } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminCommunityController } from './admin-community.controller';
import { AdminCommunityService } from './admin-community.service';

@Module({
  controllers: [AdminCommunityController],
  providers: [AdminCommunityService, PrismaService],
  exports: [AdminCommunityService],
})
export class AdminCommunityModule {}
