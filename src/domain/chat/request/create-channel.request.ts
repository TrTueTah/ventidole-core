import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEnum, IsOptional, IsArray } from 'class-validator';
import { ChatChannelType } from 'src/db/prisma/enums';

export class CreateChannelRequest {
  @ApiProperty({ 
    description: 'Channel name (optional for direct messages)',
    required: false,
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ 
    description: 'Channel description',
    required: false,
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ 
    enum: ChatChannelType,
    description: 'Type of chat channel',
  })
  @IsNotEmpty()
  @IsEnum(ChatChannelType)
  type: ChatChannelType;

  @ApiProperty({ 
    description: 'Group ID (for group channels)',
    required: false,
  })
  @IsOptional()
  @IsString()
  groupId?: string;

  @ApiProperty({ 
    description: 'Idol ID (for idol announcement channels)',
    required: false,
  })
  @IsOptional()
  @IsString()
  idolId?: string;

  @ApiProperty({ 
    description: 'Whether this is an announcement channel',
    required: false,
    default: false,
  })
  @IsOptional()
  isAnnouncement?: boolean;

  @ApiProperty({ 
    description: 'Array of user IDs to add as participants',
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  participantIds?: string[];
}
