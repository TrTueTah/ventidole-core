import { Module } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminShopController } from './admin-shop.controller';
import { AdminShopService } from './admin-shop.service';

@Module({
  controllers: [AdminShopController],
  providers: [AdminShopService, PrismaService],
  exports: [AdminShopService],
})
export class AdminShopModule {}
