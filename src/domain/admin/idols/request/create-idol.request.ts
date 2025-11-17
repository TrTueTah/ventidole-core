import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { REGEX_USER_PASSWORD } from "@shared/constant/regex.constant";
import { Transform } from "class-transformer";
import { IsEmail, IsNotEmpty, IsString, Matches, MinLength, MaxLength, IsOptional } from "class-validator";

export class CreateIdolRequest {
  @ApiProperty({
    example: 'idol@example.com',
    description: 'Idol email for login',
    type: String,
  })
  @Transform(({ value }) => typeof value === 'string' && value.toLowerCase())
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    example: 'Password@123456',
    description: 'Idol password (min 8 chars, must contain uppercase, lowercase, number and special char)',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(8)
  @Matches(REGEX_USER_PASSWORD, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, one number and one special character'
  })
  password: string;

  @ApiProperty({
    example: 'Luna Star',
    description: 'Idol stage name',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  stageName: string;

  @ApiProperty({
    example: 'group-id-123',
    description: 'Group ID that the idol belongs to',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  groupId: string;

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
    example: 'Professional singer and performer 🎤✨',
    description: 'Bio/description',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  bio?: string;

  @ApiPropertyOptional({
    example: 'FCM_DEVICE_TOKEN_HERE',
    description: 'Device token for push notifications',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  deviceToken?: string;
}