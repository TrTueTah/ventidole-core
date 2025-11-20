import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { FirebaseService } from '@shared/service/firebase/firebase.service';
import { AllowedMimeType } from '@shared/enum/file.enum';
import { ENVIRONMENT } from '@core/config/env.config';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { BaseResponse } from '@shared/helper/response';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import { UploadFileResponse } from './response/upload-file.response';
import { DeleteFileRequest } from './request/delete-file.request';
import { GetFileUrlRequest } from './request/get-file-url.request';
import { GetFileUrlResponse } from './response/get-file-url.response';
import { GetSignedUrlRequest } from './request/get-signed-url.request';
import { GetSignedUrlResponse } from './response/get-signed-url.response';

@Injectable()
export class FileService {
  private readonly logger = new Logger(FileService.name);
  private defaultBucket: string;
  private readonly DEFAULT_MAX_SIZE_MB = 10;
  private readonly DEFAULT_ALLOWED_TYPES = Object.values(AllowedMimeType);

  constructor(private readonly firebaseService: FirebaseService) {}

  // onModuleInit() {
  //   // Set default bucket name from environment
  //   const storage = this.firebaseService.getStorage();
  //   const bucket = storage.bucket(); // Firebase tự dùng bucket mặc định từ cấu hình
  //   this.defaultBucket = bucket.name;
  //   this.logger.log(`[FILE SERVICE] Initialized with bucket: ${this.defaultBucket}`);
  // }

  async uploadFile(uploadData: {
    file: Buffer;
    originalName: string;
    mimeType: string;
    folder: string;
    customFileName?: string;
    userId?: string;
  }) {
    try {
      this.validateFile(uploadData);
      const fileName = this.generateFileName(uploadData.originalName, uploadData.customFileName);
      const filePath = `${uploadData.folder}/${fileName}`;
      const storage = this.firebaseService.getStorage();
      const bucket = storage.bucket();
      const file = bucket.file(filePath);

      const metadata = {
        contentType: uploadData.mimeType,
        metadata: {
          uploadedBy: uploadData.userId,
          originalName: uploadData.originalName,
          uploadedAt: new Date().toISOString(),
        },
      };

      await file.save(uploadData.file, { metadata, public: true, validation: 'md5' });
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filePath}`;
      this.logger.log(`File uploaded successfully: ${filePath}`);

      const response = new UploadFileResponse();
      response.url = publicUrl;
      response.fileName = fileName;
      response.filePath = filePath;
      response.size = uploadData.file.length;
      response.mimeType = uploadData.mimeType;
      response.uploadedAt = new Date();

      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error('File upload failed:', error);
      throw error;
    }
  }

  async uploadMultipleFiles(files: Array<{ file: Buffer; originalName: string; mimeType: string }>, folder: string, userId?: string) {
    try {
      const uploadPromises = files.map((fileData) => this.uploadFile({ ...fileData, folder, userId }));
      const results = await Promise.all(uploadPromises);
      return BaseResponse.of(results.map((r) => r.data));
    } catch (error) {
      throw error;
    }
  }

  async deleteFile(request: DeleteFileRequest) {
    try {
      const storage = this.firebaseService.getStorage();
      const bucket = storage.bucket(this.defaultBucket);
      const file = bucket.file(request.filePath);

      const [exists] = await file.exists();
      if (!exists) throw new CustomError(ErrorCode.FileNotFound);

      await file.delete();
      this.logger.log(`File deleted successfully: ${request.filePath}`);

      return BaseResponse.of({ success: true, message: 'File deleted successfully' });
    } catch (error) {
      this.logger.error('File deletion failed:', error);
      throw error;
    }
  }

  async deleteMultipleFiles(filePaths: string[]) {
    try {
      const deletePromises = filePaths.map((filePath) => this.deleteFile({ filePath }));
      await Promise.all(deletePromises);
      return BaseResponse.of({ success: true, message: 'Files deleted successfully' });
    } catch (error) {
      throw error;
    }
  }

  async getFileUrl(request: GetFileUrlRequest) {
    try {
      const storage = this.firebaseService.getStorage();
      const bucket = storage.bucket(this.defaultBucket);
      const file = bucket.file(request.filePath);

      const [exists] = await file.exists();
      if (!exists) throw new CustomError(ErrorCode.FileNotFound);

      const url = `https://storage.googleapis.com/${this.defaultBucket}/${request.filePath}`;
      const response = new GetFileUrlResponse();
      response.url = url;

      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error('Failed to get file URL:', error);
      throw error;
    }
  }

  async getSignedUrl(request: GetSignedUrlRequest) {
    try {
      const storage = this.firebaseService.getStorage();
      const bucket = storage.bucket(this.defaultBucket);
      const file = bucket.file(request.filePath);
      const expiresInMinutes = request.expiresInMinutes || 60;

      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresInMinutes * 60 * 1000,
      });

      const response = new GetSignedUrlResponse();
      response.signedUrl = url;
      response.expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error('Failed to generate signed URL:', error);
      throw error;
    }
  }

  async fileExists(filePath: string) {
    try {
      const storage = this.firebaseService.getStorage();
      const bucket = storage.bucket(this.defaultBucket);
      const file = bucket.file(filePath);
      const [exists] = await file.exists();
      return BaseResponse.of({ exists });
    } catch (error) {
      this.logger.error('Failed to check file existence:', error);
      return BaseResponse.of({ exists: false });
    }
  }

  async getFileMetadata(filePath: string) {
    try {
      const storage = this.firebaseService.getStorage();
      const bucket = storage.bucket(this.defaultBucket);
      const file = bucket.file(filePath);
      const [metadata] = await file.getMetadata();
      return BaseResponse.of(metadata);
    } catch (error) {
      this.logger.error('Failed to get file metadata:', error);
      throw error;
    }
  }

  async listFiles(folder: string) {
    try {
      const storage = this.firebaseService.getStorage();
      const bucket = storage.bucket(this.defaultBucket);
      const [files] = await bucket.getFiles({ prefix: folder });
      const filePaths = files.map((file) => file.name);
      return BaseResponse.of({ files: filePaths });
    } catch (error) {
      this.logger.error('Failed to list files:', error);
      throw error;
    }
  }

  async deleteFolder(folder: string) {
    try {
      const result = await this.listFiles(folder);
      const files = result.data?.files || [];
      if (files.length > 0) await this.deleteMultipleFiles(files);
      this.logger.log(`Folder deleted successfully: ${folder}`);
      return BaseResponse.of({ success: true, message: 'Folder deleted successfully' });
    } catch (error) {
      this.logger.error('Failed to delete folder:', error);
      throw error;
    }
  }

  private validateFile(uploadData: {
    file: Buffer;
    originalName: string;
    mimeType: string;
    maxSizeInMB?: number;
    allowedMimeTypes?: string[];
  }): void {
    const maxSize = (uploadData.maxSizeInMB || this.DEFAULT_MAX_SIZE_MB) * 1024 * 1024;
    const allowedTypes = uploadData.allowedMimeTypes || this.DEFAULT_ALLOWED_TYPES;

    if (uploadData.file.length > maxSize) throw new CustomError(ErrorCode.FileTooLarge);
    if (!allowedTypes.includes(uploadData.mimeType)) throw new CustomError(ErrorCode.InvalidFileType);
    if (!uploadData.originalName || uploadData.originalName.trim() === '') throw new CustomError(ErrorCode.InvalidFileName);
  }

  private generateFileName(originalName: string, customFileName?: string): string {
    const timestamp = Date.now();
    const uuid = uuidv4();
    const extension = path.extname(originalName);

    if (customFileName) return `${customFileName}-${timestamp}${extension}`;

    const baseName = path.basename(originalName, extension);
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');
    return `${sanitizedName}-${uuid}${extension}`;
  }
}
