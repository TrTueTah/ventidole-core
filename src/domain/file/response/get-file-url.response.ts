import { ApiProperty } from "@nestjs/swagger";

export class GetFileUrlResponse {
  @ApiProperty({
    description: 'Public URL of the file',
    example: 'https://storage.googleapis.com/my-bucket/posts/file-uuid.jpg',
    type: String,
  })
  url: string;
}