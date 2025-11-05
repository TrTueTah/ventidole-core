import { Module, Global } from '@nestjs/common';
import { FirebaseService } from './firebase.service';

/**
 * Firebase Module - Global module for Firebase services
 * 
 * Provides:
 * - Firestore (real-time database)
 * - Firebase Authentication
 * - Firebase Cloud Messaging (push notifications)
 * - Firebase Storage (file uploads)
 * 
 * Configuration via ENVIRONMENT from @core/config/env.config
 */
@Global()
@Module({
  providers: [FirebaseService],
  exports: [FirebaseService],
})
export class FirebaseModule {}
