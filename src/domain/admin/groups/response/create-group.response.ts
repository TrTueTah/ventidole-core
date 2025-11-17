import { ApiProperty } from "@nestjs/swagger";

export class CreateGroupResponse {
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
  }
}