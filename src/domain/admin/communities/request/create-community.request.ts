import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, IsOptional } from "class-validator";

export class CreateCommunityRequest {
  @ApiProperty({
    example: 'StarLight',
    description: 'Community name',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    example: 'A talented K-pop community known for their powerful performances',
    description: 'Community description',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/bucket/avatar.jpg',
    description: 'Community avatar URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/bucket/background.jpg',
    description: 'Community background image URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  backgroundUrl?: string;
}