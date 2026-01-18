import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateBannerDto {
  @ApiProperty({ maxLength: 255 })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ maxLength: 500 })
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'imageUrl must be a valid URL' })
  @MaxLength(500)
  imageUrl: string;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'link must be a valid URL' })
  @IsOptional()
  @MaxLength(500)
  link?: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ default: 0 })
  @IsInt()
  @IsOptional()
  order?: number;
}
