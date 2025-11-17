import { Module } from '@nestjs/common';
import { AdminGroupsController } from './admin-groups.controller';
import { AdminGroupsService } from './admin-groups.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';

@Module({
  controllers: [AdminGroupsController],
  providers: [AdminGroupsService, PrismaService],
  exports: [AdminGroupsService],
})
export class AdminGroupsModule {}