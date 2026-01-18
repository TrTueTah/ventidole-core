import { Module } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminProductTypeController } from './admin-product-type.controller';
import { AdminProductTypeService } from './admin-product-type.service';

@Module({
  controllers: [AdminProductTypeController],
  providers: [AdminProductTypeService, PrismaService],
  exports: [AdminProductTypeService],
})
export class AdminProductTypeModule {}
