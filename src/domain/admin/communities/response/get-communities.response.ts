import { ApiProperty } from '@nestjs/swagger';
import { PageInfo } from '@shared/dto/pagination-response.dto';

export class IdolSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  stageName: string;

  @ApiProperty()
  avatarUrl?: string;

  constructor(data: any) {
    this.id = data.id;
    this.stageName = data.stageName;
    this.avatarUrl = data.avatarUrl;
  }
}

export class CommunityCountDto {
  @ApiProperty()
  idols: number;

  @ApiProperty()
  followers: number;

  constructor(data: any) {
    this.idols = data.idols;
    this.followers = data.followers;
  }
}

export class CommunityDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  avatarUrl?: string;

  @ApiProperty()
  backgroundUrl?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  version: number;

  @ApiProperty({ type: [IdolSummaryDto] })
  idols: IdolSummaryDto[];

  @ApiProperty({ type: CommunityCountDto })
  _count: CommunityCountDto;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.avatarUrl = data.avatarUrl;
    this.backgroundUrl = data.backgroundUrl;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.version = data.version;
    this.idols = data.idols ? data.idols.map((idol: any) => new IdolSummaryDto(idol)) : [];
    this._count = new CommunityCountDto(data._count);
  }
}

export class GetCommunitiesResponse {
  @ApiProperty({
    description: 'Array of communities',
    type: [CommunityDto],
  })
  data: CommunityDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PageInfo,
  })
  paging: PageInfo;
}