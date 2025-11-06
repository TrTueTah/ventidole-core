import { ApiProperty } from "@nestjs/swagger";

export class UploadFileResponse {
  @ApiProperty({
    description: 'Public URL of the uploaded file',
    example: 'https://storage.googleapis.com/my-bucket/posts/file-uuid.jpg',
    type: String,
  })
  url: string;

  @ApiProperty({
    description: 'Name of the uploaded file',
    example: 'file-uuid.jpg',
    type: String,
  })
  fileName: string;

  @ApiProperty({
    description: 'Full path of the file in storage',
    example: 'posts/file-uuid.jpg',
    type: String,
  })
  filePath: string;

  @ApiProperty({
    description: 'Size of the file in bytes',
    example: 102400,
    type: Number,
  })
  size: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
    type: String,
  })
  mimeType: string;

  @ApiProperty({
    description: 'Upload timestamp',
    example: '2025-11-06T08:00:00.000Z',
    type: Date,
  })
  uploadedAt: Date;
}