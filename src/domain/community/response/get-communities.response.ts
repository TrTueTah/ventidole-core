import { ApiProperty } from '@nestjs/swagger';

export class GetCommunitiesResponse {
  @ApiProperty({
    type: String,
  })
  id: string;
  @ApiProperty({
    type: String,
  })
  name: string;

  @ApiProperty({ type: String, required: false })
  avatarUrl?: string;

  @ApiProperty({ type: String, required: false })
  backgroundUrl?: string;

  @ApiProperty({
    type: Boolean,
    description: 'Indicates if the current user has joined this community',
  })
  isJoin: boolean;

  @ApiProperty({
    type: Number,
    description: 'Total number of followers in the community',
  })
  followerCount: number;

  @ApiProperty({
    type: Date,
  })
  createdAt: Date;

  @ApiProperty({
    type: Date,
  })
  updatedAt: Date;

  constructor(data: any, isJoin: boolean = false) {
    this.id = data.id;
    this.name = data.name;
    this.avatarUrl = data.avatarUrl;
    this.backgroundUrl = data.backgroundUrl;
    this.isJoin = isJoin;
    this.followerCount = data._count?.followers ?? 0;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
