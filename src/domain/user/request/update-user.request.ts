import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateUserRequest {
  @ApiPropertyOptional({
    example: 'user@example.com',
    description: 'User email',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  email?: string;

  @ApiPropertyOptional({
    example: 'johndoe',
    description: 'Username',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  username?: string;

  @ApiPropertyOptional({
    example: 'device-token-xyz123',
    description: 'Device token for push notifications',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  deviceToken?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/background.jpg',
    description: 'Background URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  backgroundUrl?: string;

  @ApiPropertyOptional({
    example: 'I love K-pop!',
    description: 'User bio',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;
}
