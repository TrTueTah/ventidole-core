import { ApiProperty } from '@nestjs/swagger';
import { BannerDto } from './banner.dto';

export class BannerDetailDto extends BannerDto {
  @ApiProperty()
  version: number;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty({ required: false })
  deletedAt?: Date;

  @ApiProperty({ required: false })
  metadata?: any;
}
