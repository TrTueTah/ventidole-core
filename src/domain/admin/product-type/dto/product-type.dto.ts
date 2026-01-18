import { ApiProperty } from '@nestjs/swagger';

export class AdminProductTypeDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Product Type ID' })
  id: string;

  @ApiProperty({
    example: 'Clothing',
    description: 'Product type name',
  })
  name: string;

  @ApiProperty({
    example: true,
    description: 'Whether the product type is active',
  })
  isActive: boolean;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Created at',
  })
  createdAt: Date;

  @ApiProperty({
    example: '2023-01-01T00:00:00.000Z',
    description: 'Updated at',
  })
  updatedAt: Date;
}

export class AdminProductTypeDetailDto extends AdminProductTypeDto {
  @ApiProperty({
    example: 0,
    description: 'Version',
  })
  version: number;

  @ApiProperty({
    example: 10,
    description: 'Number of products using this type',
  })
  productCount: number;
}
