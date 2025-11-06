import { Module, Global } from '@nestjs/common';
import { FileService } from './file.service';
import { FileController } from './file.controller';
import { FirebaseModule } from '../../shared/service/firebase/firebase.module';

/**
 * File Module - Global module for file operations
 * 
 * Provides:
 * - File upload to Firebase Storage
 * - File deletion
 * - File URL generation (public and signed)
 * - File validation
 * - Multiple file operations
 * 
 * Uses Firebase Storage for cloud file management
 */
@Global()
@Module({
  imports: [FirebaseModule],
  controllers: [FileController],
  providers: [FileService],
  exports: [FileService],
})
export class FileModule {}
