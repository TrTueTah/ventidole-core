import { ApiProperty } from '@nestjs/swagger';

export class ChatChannelDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  memberCount: number;

  @ApiProperty({ required: false })
  lastMessageAt?: Date;
}
