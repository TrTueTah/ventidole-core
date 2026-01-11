import { ApiProperty } from '@nestjs/swagger';

/**
 * Product Variant Response DTO
 */
export class ProductVariantResponseDto {
  @ApiProperty({ example: 'variant_abc123' })
  id: string;

  @ApiProperty({ example: 'Size M - Red' })
  name: string;

  @ApiProperty({ example: 35000 })
  price: number;

  @ApiProperty({ example: 50 })
  stock: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T08:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T14:45:00Z' })
  updatedAt: Date;
}

/**
 * Product Response DTO
 *
 * Response DTO for product data.
 */
export class ProductResponseDto {
  @ApiProperty({ example: 'prod_abc123' })
  id: string;

  @ApiProperty({ example: 'shop_xyz789' })
  shopId: string;

  @ApiProperty({ example: 'K-Pop Official T-Shirt' })
  name: string;

  @ApiProperty({ example: 'High-quality cotton t-shirt with official group logo', nullable: true })
  description: string | null;

  @ApiProperty({ example: 30000 })
  basePrice: number;

  @ApiProperty({ type: [String], example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'] })
  imageUrls: string[];

  @ApiProperty({ example: 'Apparel', nullable: true })
  category: string | null;

  @ApiProperty({ type: [ProductVariantResponseDto] })
  variants: ProductVariantResponseDto[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: false })
  isDeleted: boolean;

  @ApiProperty({ example: '2024-01-15T08:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T14:45:00Z' })
  updatedAt: Date;
}
