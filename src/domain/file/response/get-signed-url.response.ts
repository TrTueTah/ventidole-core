import { ApiProperty } from "@nestjs/swagger";

export class GetSignedUrlResponse {
  @ApiProperty({
    description: 'Signed URL for temporary access',
    example: 'https://storage.googleapis.com/my-bucket/posts/file-uuid.jpg?X-Goog-Algorithm=...',
    type: String,
  })
  signedUrl: string;

  @ApiProperty({
    description: 'Expiration time of the signed URL',
    example: '2025-11-06T09:00:00.000Z',
    type: Date,
  })
  expiresAt: Date;
}