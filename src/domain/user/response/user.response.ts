import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/db/prisma/enums';

export class FanDto {
  @ApiProperty({
    description: 'Fan ID',
    example: 'fan-clx123abc',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Fan username',
    example: 'cool_username',
    type: String,
  })
  username: string;

  @ApiPropertyOptional({
    description: 'Fan avatar URL',
    example: 'https://storage.googleapis.com/bucket/avatars/fan-123.jpg',
    type: String,
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Fan background image URL',
    example: 'https://storage.googleapis.com/bucket/backgrounds/fan-123.jpg',
    type: String,
  })
  backgroundUrl?: string;

  @ApiPropertyOptional({
    description: 'Fan bio/description',
    example: 'Music lover and K-pop enthusiast 🎵',
    type: String,
  })
  bio?: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
  })
  updatedAt: Date;
}

export class IdolDto {
  @ApiProperty({
    description: 'Idol ID',
    example: 'idol-clx123abc',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'Idol stage name',
    example: 'StarLight',
    type: String,
  })
  stageName: string;

  @ApiPropertyOptional({
    description: 'Idol avatar URL',
    example: 'https://storage.googleapis.com/bucket/avatars/idol-123.jpg',
    type: String,
  })
  avatarUrl?: string;

  @ApiPropertyOptional({
    description: 'Idol background image URL',
    example: 'https://storage.googleapis.com/bucket/backgrounds/idol-123.jpg',
    type: String,
  })
  backgroundUrl?: string;

  @ApiPropertyOptional({
    description: 'Idol bio/description',
    example: 'Professional singer and performer 🎤',
    type: String,
  })
  bio?: string;

  @ApiProperty({
    description: 'Group ID',
    example: 'group-clx123abc',
    type: String,
  })
  groupId: string;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
  })
  updatedAt: Date;
}

export class UserDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user-123e4567',
    type: String,
  })
  id: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
    type: String,
  })
  email: string;

  @ApiProperty({
    description: 'User role',
    enum: Role,
    example: Role.FAN,
  })
  role: Role;

  @ApiPropertyOptional({
    description: 'Device token for push notifications',
    example: 'device-token-xyz123',
    type: String,
  })
  deviceToken?: string;

  @ApiProperty({
    description: 'Online status',
    example: true,
    type: Boolean,
  })
  isOnline: boolean;

  @ApiProperty({
    description: 'Active status',
    example: true,
    type: Boolean,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Fan profile (only present if user is a FAN)',
    type: () => FanDto,
  })
  fan?: FanDto;

  @ApiPropertyOptional({
    description: 'Idol profile (only present if user is an IDOL)',
    type: () => IdolDto,
  })
  idol?: IdolDto;

  @ApiProperty({
    description: 'Created at timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated at timestamp',
    example: '2024-01-01T00:00:00.000Z',
    type: String,
  })
  updatedAt: Date;
}
