import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';

export class CreateChannelDto {
  @ApiProperty({
    description: 'Channel name',
    example: 'General Discussion',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Channel description',
    example: 'A place for general discussion',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Channel image URL',
    example: 'https://example.com/image.jpg',
  })
  @IsUrl()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    description: 'Channel type',
    example: 'messaging',
    default: 'messaging',
  })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Community ID to associate with this channel',
    example: 'cm123abc',
  })
  @IsString()
  @IsOptional()
  communityId?: string;

  @ApiPropertyOptional({
    description: 'Whether this is a community channel',
    example: false,
    default: false,
  })
  @IsBoolean()
  @IsOptional()
  isCommunityChannel?: boolean;
}
