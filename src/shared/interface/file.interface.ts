export interface UploadFileDto {
  file: Buffer;
  originalName: string;
  mimeType: string;
  folder: string;
  userId?: string;
  customFileName?: string;
}

export interface UploadResult {
  url: string;
  fileName: string;
  filePath: string;
  size: number;
  mimeType: string;
  uploadedAt: Date;
}

export interface DeleteFileDto {
  filePath: string;
}

export interface FileValidationOptions {
  maxSizeInMB?: number;
  allowedMimeTypes?: string[];
}

export interface FileMetadata {
  contentType: string;
  metadata?: {
    uploadedBy?: string;
    originalName?: string;
    [key: string]: any;
  };
}
