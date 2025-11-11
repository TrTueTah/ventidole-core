import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsArray } from 'class-validator';

export class AddParticipantsRequest {
  @ApiProperty({ 
    description: 'Chat channel ID',
  })
  @IsNotEmpty()
  @IsString()
  channelId: string;

  @ApiProperty({ 
    description: 'Array of user IDs to add',
    type: [String],
  })
  @IsNotEmpty()
  @IsArray()
  @IsString({ each: true })
  userIds: string[];
}
