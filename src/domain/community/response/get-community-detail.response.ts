import { ApiProperty } from '@nestjs/swagger';

class IdolInfo {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  userId: string;

  @ApiProperty({ type: String })
  stageName: string;

  @ApiProperty({ type: String, required: false })
  bio?: string;

  @ApiProperty({ type: String, required: false })
  avatarUrl?: string;
}

export class GetCommunityDetailResponse {
  @ApiProperty({ type: String })
  id: string;

  @ApiProperty({ type: String })
  name: string;

  @ApiProperty({ type: String, required: false })
  description?: string;

  @ApiProperty({ type: String, required: false })
  avatarUrl?: string;

  @ApiProperty({ type: String, required: false })
  backgroundUrl?: string;

  @ApiProperty({
    type: Number,
    description: 'Total number of followers in the community'
  })
  followerCount: number;

  @ApiProperty({
    type: Boolean,
    description: 'Indicates if the current user is following this community'
  })
  isFollowing: boolean;

  @ApiProperty({
    type: [IdolInfo],
    description: 'List of idols in this community'
  })
  idols: IdolInfo[];

  @ApiProperty({ type: Date })
  createdAt: Date;

  @ApiProperty({ type: Date })
  updatedAt: Date;
}
