import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateCommunityChannelDto {
  @ApiProperty({
    description: 'Community ID',
    example: 'clxyz123abc',
  })
  @IsString()
  @IsNotEmpty()
  communityId: string;

  @ApiProperty({
    description: 'Channel name',
    example: 'Community General Chat',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Channel description',
    example: 'A place for all community idols to chat',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}
