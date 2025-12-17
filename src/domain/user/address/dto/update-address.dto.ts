import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateAddressDto {
  @ApiProperty({ required: false, example: 'John' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  firstName?: string;

  @ApiProperty({ required: false, example: 'Doe' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  lastName?: string;

  @ApiProperty({ required: false, example: '0901234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phoneNumber?: string;

  @ApiProperty({ required: false, example: 1, description: 'Province code' })
  @IsInt()
  @IsOptional()
  provinceCode?: number;

  @ApiProperty({ required: false, example: 1, description: 'District code' })
  @IsInt()
  @IsOptional()
  districtCode?: number;

  @ApiProperty({ required: false, example: '123 Main Street, Ward 1' })
  @IsString()
  @IsOptional()
  detailAddress?: string;

  @ApiProperty({
    required: false,
    example: false,
    description: 'Set as default address',
  })
  @IsOptional()
  @IsBoolean()
  isDefaultAddress?: boolean;

  @ApiProperty({ required: false, nullable: true })
  @IsOptional()
  options?: any;
}
