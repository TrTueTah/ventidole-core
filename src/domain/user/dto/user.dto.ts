import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  username: string;

  @ApiProperty({ enum: Role })
  role: Role;

  @ApiProperty({ required: false })
  avatarUrl?: string;

  @ApiProperty({ required: false })
  backgroundUrl?: string;

  @ApiProperty({ required: false })
  bio?: string;

  @ApiProperty({ required: false })
  communityId?: string;

  @ApiProperty()
  isOnline: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
