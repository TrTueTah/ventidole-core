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

export class GroupCountDto {
  @ApiProperty()
  idols: number;

  @ApiProperty()
  followers: number;

  constructor(data: any) {
    this.idols = data.idols;
    this.followers = data.followers;
  }
}

export class GroupDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  groupName: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  logoUrl?: string;

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

  @ApiProperty({ type: GroupCountDto })
  _count: GroupCountDto;

  constructor(data: any) {
    this.id = data.id;
    this.groupName = data.groupName;
    this.description = data.description;
    this.logoUrl = data.logoUrl;
    this.backgroundUrl = data.backgroundUrl;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.version = data.version;
    this.idols = data.idols ? data.idols.map((idol: any) => new IdolSummaryDto(idol)) : [];
    this._count = new GroupCountDto(data._count);
  }
}

export class GetGroupsResponse {
  @ApiProperty({
    description: 'Array of groups',
    type: [GroupDto],
  })
  data: GroupDto[];

  @ApiProperty({
    description: 'Pagination information',
    type: PageInfo,
  })
  paging: PageInfo;
}