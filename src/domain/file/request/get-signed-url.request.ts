import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class GetSignedUrlRequest {
  @ApiProperty({
    description: 'Path to the file in storage',
    example: 'posts/my-file-uuid.jpg',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  filePath: string;

  @ApiProperty({
    description: 'Expiration time in minutes',
    example: 60,
    default: 60,
    type: Number,
  })
  @IsOptional()
  expiresInMinutes?: number;
}