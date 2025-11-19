import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsString, MaxLength, IsOptional, IsArray, ValidateNested, IsNumber, IsPositive, Min } from "class-validator";
import { Type, Transform } from "class-transformer";

export class CreateProductVariantRequest {
  @ApiProperty({
    example: 'Standard Version',
    description: 'Product variant name',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({
    example: 29.99,
    description: 'Product variant price',
    type: Number,
  })
  @IsNumber()
  @IsPositive()
  @Transform(({ value }) => parseFloat(value))
  price_money: number;

  @ApiProperty({
    example: 100,
    description: 'Total supply/stock for this variant',
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @Transform(({ value }) => parseInt(value))
  total_supply: number;

  @ApiPropertyOptional({
    example: 100,
    description: 'Remaining supply (defaults to total_supply if not provided)',
    type: Number,
  })
  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  remaining_supply?: number;
}

export class CreateProductRequest {
  @ApiProperty({
    example: 'BTS Official Light Stick',
    description: 'Product name',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    example: 'Official BTS light stick for concerts and fan events. High quality and long-lasting.',
    description: 'Product description',
    type: String,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    example: 'https://res.cloudinary.com/bucket/bts-lightstick.jpg',
    description: 'Product cover image URL',
    type: String,
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  cover_image?: string;

  @ApiProperty({
    example: 'cmi64epuq0000p5wb5q352lws',
    description: 'Product category ID',
    type: String,
  })
  @IsString()
  @IsNotEmpty()
  product_category_id: string;

  @ApiProperty({
    description: 'Product variants (at least one variant is required)',
    type: [CreateProductVariantRequest],
    example: [
      {
        name: 'Standard Version',
        price_money: 29.99,
        total_supply: 100,
        remaining_supply: 100
      },
      {
        name: 'Premium Version',
        price_money: 35.99,
        total_supply: 50,
        remaining_supply: 50
      }
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateProductVariantRequest)
  variants: CreateProductVariantRequest[];
}