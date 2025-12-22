import { Global, Module } from '@nestjs/common';
import { GetStreamNotificationService } from './getstream-notification.service';

@Global()
@Module({
  providers: [GetStreamNotificationService],
  exports: [GetStreamNotificationService],
})
export class GetStreamNotificationModule {}
