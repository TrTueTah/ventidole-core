import { ApiProperty } from "@nestjs/swagger";

export class CreateIdolResponse {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  idol: {
    id: string;
    stageName: string;
    avatarUrl?: string;
    backgroundUrl?: string;
    bio?: string;
    groupId: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  };

  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
