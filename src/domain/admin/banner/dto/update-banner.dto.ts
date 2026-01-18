import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class UpdateBannerDto {
  @ApiProperty({ required: false, maxLength: 255 })
  @IsString()
  @IsOptional()
  @MaxLength(255)
  title?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'imageUrl must be a valid URL' })
  @IsOptional()
  @MaxLength(500)
  imageUrl?: string;

  @ApiProperty({ required: false, maxLength: 500 })
  @IsString()
  @Matches(/^https?:\/\/.+/, { message: 'link must be a valid URL' })
  @IsOptional()
  @MaxLength(500)
  link?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @IsOptional()
  order?: number;

  @ApiProperty({ required: false })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
