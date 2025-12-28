import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @ApiProperty({
    example: 'john_doe',
    description: 'Username',
    type: String,
    required: false,
  })
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
    type: String,
    required: false,
  })
  avatarUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  @ApiProperty({
    example: 'https://example.com/background.jpg',
    description: 'Background image URL',
    type: String,
    required: false,
  })
  backgroundUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  @ApiProperty({
    example: 'Passionate K-pop fan 🎵',
    description: 'User bio/description',
    type: String,
    required: false,
  })
  bio?: string;
}
