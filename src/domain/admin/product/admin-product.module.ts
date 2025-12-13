import { Module } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminProductController } from './admin-product.controller';
import { AdminProductService } from './admin-product.service';

@Module({
  controllers: [AdminProductController],
  providers: [AdminProductService, PrismaService],
  exports: [AdminProductService],
})
export class AdminProductModule {}
