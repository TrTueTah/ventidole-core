import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from 'src/db/prisma/enums';

export class UserDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'User ID' })
  id: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'User email',
  })
  email: string;

  @ApiProperty({
    example: 'john_doe',
    description: 'Username',
  })
  username: string;

  @ApiProperty({
    example: 'USER',
    description: 'User role',
    enum: Role,
  })
  role: Role;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'User avatar URL',
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/background.jpg',
    description: 'User background URL',
  })
  backgroundUrl?: string | null;

  @ApiPropertyOptional({
    example: 'A short bio about me',
    description: 'User bio',
  })
  bio?: string | null;

  @ApiProperty({
    example: true,
    description: 'Whether the user is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: false,
    description: 'Whether the user is online',
  })
  isOnline: boolean;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Creation timestamp',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Last update timestamp',
  })
  updatedAt: Date;
}
