import { ApiProperty } from '@nestjs/swagger';

export class DistrictDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: number;

  @ApiProperty()
  codename: string;

  @ApiProperty()
  divisionType: string;

  @ApiProperty()
  provinceCode: number;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
