import { Global, Module } from '@nestjs/common';
import { KnockWorkflowService } from './knock-workflow.service';
import { KnockUserService } from './knock-user.service';

@Global()
@Module({
  providers: [KnockWorkflowService, KnockUserService],
  exports: [KnockWorkflowService, KnockUserService],
})
export class KnockWorkflowModule {}
