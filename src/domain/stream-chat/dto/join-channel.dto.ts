import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinChannelDto {
  @ApiProperty({
    description: 'Channel ID to join',
    example: 'community_123_1234567890',
  })
  @IsString()
  @IsNotEmpty()
  channelId: string;
}
