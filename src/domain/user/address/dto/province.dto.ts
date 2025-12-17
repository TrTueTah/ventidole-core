import { ApiProperty } from '@nestjs/swagger';

export class ProvinceDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: number;

  @ApiProperty()
  divisionType: string;

  @ApiProperty()
  phoneCode: number;

  @ApiProperty()
  codename: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
