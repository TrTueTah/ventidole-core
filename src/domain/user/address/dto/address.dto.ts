import { ApiProperty } from '@nestjs/swagger';
import { DistrictDto } from './district.dto';
import { ProvinceDto } from './province.dto';

export class AddressDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  firstName: string;

  @ApiProperty()
  lastName: string;

  @ApiProperty()
  phoneNumber: string;

  @ApiProperty()
  provinceCode: number;

  @ApiProperty()
  districtCode: number;

  @ApiProperty()
  detailAddress: string;

  @ApiProperty({ example: false })
  isDefaultAddress: boolean;

  @ApiProperty({ required: false, nullable: true })
  options?: any;

  @ApiProperty({ type: ProvinceDto })
  province: ProvinceDto;

  @ApiProperty({ type: DistrictDto })
  district: DistrictDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}
