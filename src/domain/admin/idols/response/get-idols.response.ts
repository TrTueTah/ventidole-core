import { ApiProperty } from '@nestjs/swagger';
import { PageInfo } from '@shared/dto/pagination-response.dto';

export class UserSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  isOnline: boolean;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.email = data.email;
    this.role = data.role;
    this.isOnline = data.isOnline;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
  }
}

export class GroupSummaryDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  groupName: string;

  @ApiProperty()
  logoUrl?: string;

  constructor(data: any) {
    this.id = data.id;
    this.groupName = data.groupName;
    this.logoUrl = data.logoUrl;
  }
}

export class IdolDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  stageName: string;

  @ApiProperty()
  avatarUrl?: string;

  @ApiProperty()
  backgroundUrl?: string;

  @ApiProperty()
  bio?: string;

  @ApiProperty()
  groupId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  version: number;

  @ApiProperty({ type: UserSummaryDto })
  user: UserSummaryDto;

  @ApiProperty({ type: GroupSummaryDto })
  group: GroupSummaryDto;

  constructor(data: any) {
    this.id = data.id;
    this.stageName = data.stageName;
    this.avatarUrl = data.avatarUrl;
    this.backgroundUrl = data.backgroundUrl;
    this.bio = data.bio;
    this.groupId = data.groupId;
    this.userId = data.userId;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
    this.version = data.version;
    this.user = new UserSummaryDto(data.user);
    this.group = new GroupSummaryDto(data.group);
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