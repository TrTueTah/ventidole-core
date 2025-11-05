import { Module } from '@nestjs/common';
import { FirebaseModule } from '../firebase/firebase.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MultiDatabaseService } from './multi-database.service';

/**
 * Multi-Database Module
 * Integrates PostgreSQL (Prisma) + Firebase for mobile apps
 * 
 * Features:
 * - User management (PostgreSQL)
 * - Real-time chat (Firebase Firestore)
 * - Online presence (Firebase Firestore)
 * - Push notifications (Firebase Cloud Messaging)
 * - File storage (Firebase Storage)
 */
@Module({
  imports: [
    FirebaseModule,
    PrismaModule,
  ],
  providers: [MultiDatabaseService],
  exports: [MultiDatabaseService],
})
export class MultiDatabaseModule {}
