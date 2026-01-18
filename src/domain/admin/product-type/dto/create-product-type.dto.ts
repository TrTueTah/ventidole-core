import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateProductTypeDto {
  @ApiProperty({
    example: 'Clothing',
    description: 'Product type name',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;
}
