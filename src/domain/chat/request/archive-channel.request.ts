import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ArchiveChannelRequest {
  @ApiProperty({
    description: 'Channel ID to archive',
  })
  @IsNotEmpty()
  @IsString()
  channelId: string;
}
