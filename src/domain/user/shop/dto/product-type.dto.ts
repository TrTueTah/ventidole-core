import { ApiProperty } from '@nestjs/swagger';

export class ShopProductTypeDto {
  @ApiProperty({
    example: 'clxxxxxxxxxxxxxxxxxx',
    description: 'Product type ID',
  })
  id: string;

  @ApiProperty({
    example: 'Apparel',
    description: 'Product type name',
  })
  name: string;
}
