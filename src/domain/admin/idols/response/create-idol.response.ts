import { ApiProperty } from "@nestjs/swagger";

export class CreatedIdolDto {
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
  }
}

export class CreateIdolResponse {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty({ type: CreatedIdolDto })
  idol: CreatedIdolDto;

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  constructor(userId: string, email: string, role: string, idol: any, accessToken: string, refreshToken: string) {
    this.userId = userId;
    this.email = email;
    this.role = role;
    this.idol = new CreatedIdolDto(idol);
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
  }
}