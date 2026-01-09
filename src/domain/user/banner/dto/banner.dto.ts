import { ApiProperty } from '@nestjs/swagger';

export class UserBannerDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  title: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  imageUrl: string;

  @ApiProperty({ required: false })
  link?: string;

  @ApiProperty()
  startDate: Date;

  @ApiProperty()
  endDate: Date;

  @ApiProperty()
  order: number;
}
