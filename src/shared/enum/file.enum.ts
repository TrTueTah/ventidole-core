/**
 * File-related enums for Firebase Storage service
 */

export enum FileFolder {
  Profiles = 'profiles',
  Posts = 'posts',
  Attachments = 'attachments',
  Documents = 'documents',
  Thumbnails = 'thumbnails',
  Temp = 'temp',
}

export enum AllowedMimeType {
  // Images
  JPEG = 'image/jpeg',
  PNG = 'image/png',
  GIF = 'image/gif',
  WEBP = 'image/webp',
  SVG = 'image/svg+xml',

  // Documents
  PDF = 'application/pdf',
  DOC = 'application/msword',
  DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  XLS = 'application/vnd.ms-excel',
  XLSX = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  PPT = 'application/vnd.ms-powerpoint',
  PPTX = 'application/vnd.openxmlformats-officedocument.presentationml.presentation',

  // Text
  TXT = 'text/plain',
  CSV = 'text/csv',

  // Video
  MP4 = 'video/mp4',
  WEBM = 'video/webm',
  OGG = 'video/ogg',

  // Audio
  MP3 = 'audio/mpeg',
  WAV = 'audio/wav',
  OGG_AUDIO = 'audio/ogg',
}

export enum FileErrorCode {
  FileTooLarge = 'FILE_TOO_LARGE',
  InvalidFileType = 'INVALID_FILE_TYPE',
  UploadFailed = 'UPLOAD_FAILED',
  DeleteFailed = 'DELETE_FAILED',
  FileNotFound = 'FILE_NOT_FOUND',
  InvalidFileName = 'INVALID_FILE_NAME',
}
