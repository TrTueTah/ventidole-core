import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, IsOptional } from "class-validator";

export class CreateFanRequest {
  @ApiProperty({
    example: 'cool_username',
    description: 'Fan username (required)',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  username: string;

  @ApiPropertyOptional({
    example: 'https://storage.googleapis.com/bucket/avatars/fan-123.jpg',
    description: 'Avatar URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://storage.googleapis.com/bucket/backgrounds/fan-123.jpg',
    description: 'Background image URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  backgroundUrl?: string;

  @ApiPropertyOptional({
    example: 'Music lover and K-pop enthusiast 🎵',
    description: 'Bio/description',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;
}
