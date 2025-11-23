import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LeaveCommunityRequest {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The ID of the community to leave',
  })
  @IsNotEmpty()
  @IsString()
  communityId: string;
}
