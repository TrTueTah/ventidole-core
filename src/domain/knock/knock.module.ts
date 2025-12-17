import { Module } from '@nestjs/common';
import { KnockWorkflowService } from '@shared/service/knock-workflow/knock-workflow.service';
import { PrismaModule } from '@shared/service/prisma/prisma.module';
import { KnockController } from './knock.controller';
import { KnockService } from './knock.service';

@Module({
  imports: [PrismaModule],
  controllers: [KnockController],
  providers: [KnockService, KnockWorkflowService],
  exports: [KnockService],
})
export class KnockModule {}
