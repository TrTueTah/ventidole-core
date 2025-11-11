import { Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { FirebaseService } from '../firebase/firebase.service';

@Module({
  providers: [NotificationService, FirebaseService],
  exports: [NotificationService],
})
export class NotificationModule {}
