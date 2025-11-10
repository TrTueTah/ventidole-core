import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateIdolRequest {
  @ApiPropertyOptional({
    example: 'StarLight',
    description: 'Idol stage name',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  stageName?: string;

  @ApiPropertyOptional({
    example: 'https://storage.googleapis.com/bucket/avatars/idol-123.jpg',
    description: 'Avatar URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://storage.googleapis.com/bucket/backgrounds/idol-123.jpg',
    description: 'Background image URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  backgroundUrl?: string;

  @ApiPropertyOptional({
    example: 'Professional singer and performer 🎤',
    description: 'Bio/description',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;
}
