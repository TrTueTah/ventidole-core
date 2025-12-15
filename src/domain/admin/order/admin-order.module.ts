import { Module } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminOrderController } from './admin-order.controller';
import { AdminOrderService } from './admin-order.service';

@Module({
  controllers: [AdminOrderController],
  providers: [AdminOrderService, PrismaService],
  exports: [AdminOrderService],
})
export class AdminOrderModule {}
