import { Global, Module } from '@nestjs/common';
import { KnockWorkflowService } from './knock-workflow.service';

@Global()
@Module({
  providers: [KnockWorkflowService],
  exports: [KnockWorkflowService],
})
export class KnockWorkflowModule {}
