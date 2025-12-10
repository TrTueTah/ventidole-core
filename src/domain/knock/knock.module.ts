import { Module } from '@nestjs/common';
import { PrismaModule } from '@shared/service/prisma/prisma.module';
import { KnockController } from './knock.controller';
import { KnockService } from './knock.service';

@Module({
  imports: [PrismaModule],
  controllers: [KnockController],
  providers: [KnockService],
  exports: [KnockService],
})
export class KnockModule {}
