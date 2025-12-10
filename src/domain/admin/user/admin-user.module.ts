import { Module } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminUserController } from './admin-user.controller';
import { AdminUserService } from './admin-user.service';

@Module({
  controllers: [AdminUserController],
  providers: [AdminUserService, PrismaService],
  exports: [AdminUserService],
})
export class AdminUserModule {}
