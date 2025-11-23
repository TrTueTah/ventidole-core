import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from 'class-validator';

export class JoinCommunityRequest {
  @ApiProperty({
    type: String,
    required: true,
    description: 'The ID of the community to join',
  })
  @IsNotEmpty()
  @IsString()
  communityId: string;
}