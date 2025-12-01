import { CommunityDto } from '@domain/admin/communities/response/get-communities.response';
import { ApiProperty } from '@nestjs/swagger';
import { PageInfo } from '@shared/dto/pagination-response.dto';

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.email = data.email;
    this.username = data.username;
    this.role = data.role;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
  }
}

export class IdolDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  username: string;

  @ApiProperty()
  avatarUrl?: string;

  @ApiProperty()
  backgroundUrl?: string;

  @ApiProperty()
  bio?: string;

  @ApiProperty()
  communityId?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  version: number;

  @ApiProperty({ type: UserSummaryDto })
  community?: CommunityDto;

  constructor(data: any) {
    this.id = data.id;
    this.username = data.username;
    this.avatarUrl = data.avatarUrl;
    this.backgroundUrl = data.backgroundUrl;
    this.bio = data.bio;
    this.communityId = data.communityId;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.version = data.version;
    if (data.community) {
      this.community = new CommunityDto(data.community);
    }
  }
}

export class GetIdolsResponse {
  @ApiProperty({
    description: 'Array of idols',
    type: [IdolDto],
  })
  data: IdolDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PageInfo,
  })
  paging: PageInfo;
}