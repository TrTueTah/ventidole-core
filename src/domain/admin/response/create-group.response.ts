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
}
