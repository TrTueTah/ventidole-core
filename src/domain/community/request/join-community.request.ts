import { ApiProperty } from "@nestjs/swagger";

export class JoinCommunityRequest {
  @ApiProperty({
    type: String,
    required: true,
  })
  communityId: string;
}