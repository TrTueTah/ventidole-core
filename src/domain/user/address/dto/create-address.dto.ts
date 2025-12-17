import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateAddressDto {
  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ example: '0901234567' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  phoneNumber: string;

  @ApiProperty({ example: 1, description: 'Province code' })
  @IsInt()
  @IsNotEmpty()
  provinceCode: number;

  @ApiProperty({ example: 1, description: 'District code' })
  @IsInt()
  @IsNotEmpty()
  districtCode: number;

  @ApiProperty({ example: '123 Main Street, Ward 1' })
  @IsString()
  @IsNotEmpty()
  detailAddress: string;

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
