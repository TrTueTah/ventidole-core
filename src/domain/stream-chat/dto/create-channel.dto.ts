import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({
    description: 'Channel type (messaging, team, etc.)',
    example: 'messaging',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({
    description: 'Channel ID (auto-generated if not provided)',
    example: 'channel_123',
  })
  @IsString()
  @IsOptional()
  channelId?: string;

  @ApiProperty({
    description: 'Array of user IDs to add as members',
    example: ['user_1', 'user_2'],
  })
  @IsArray()
  @IsString({ each: true })
  members: string[];

  @ApiPropertyOptional({
    description: 'Channel name',
    example: 'General Discussion',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'Channel description',
    example: 'A place for general discussion',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
