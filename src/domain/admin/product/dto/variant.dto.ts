import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateVariantDto {
  @ApiProperty({
    example: 'Size M - Red',
    description: 'Variant name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 29.99,
    description: 'Variant price',
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    example: 50,
    description: 'Variant stock quantity',
  })
  @IsNumber()
  @Min(0)
  stock: number;
}

export class UpdateVariantDto {
  @ApiPropertyOptional({
    example: 'clxxxxxxx',
    description: 'Variant ID (required for updating existing variant, omit for new variant)',
  })
  @IsString()
  @IsOptional()
  id?: string;

  @ApiProperty({
    example: 'Size M - Red',
    description: 'Variant name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 29.99,
    description: 'Variant price',
  })
  @IsNumber()
  @IsPositive()
  price: number;

  @ApiProperty({
    example: 50,
    description: 'Variant stock quantity',
  })
  @IsNumber()
  @Min(0)
  stock: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the variant is active',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
