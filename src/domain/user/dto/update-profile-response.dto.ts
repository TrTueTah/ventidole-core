import { ApiProperty } from '@nestjs/swagger';

export class UpdateProfileResponseDto {
  @ApiProperty({
    example: 'clx123abc',
    description: 'User ID',
    type: String,
  })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Email',
    type: String,
  })
  email: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username',
    type: String,
  })
  username: string;

  @ApiProperty({
    example: 'FAN',
    description: 'User role',
    type: String,
  })
  role: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar URL',
    type: String,
    required: false,
  })
  avatarUrl?: string;

  @ApiProperty({
    example: 'https://example.com/background.jpg',
    description: 'Background URL',
    type: String,
    required: false,
  })
  backgroundUrl?: string;

  @ApiProperty({
    example: 'Passionate K-pop fan 🎵',
    description: 'User bio',
    type: String,
    required: false,
  })
  bio?: string;
}
