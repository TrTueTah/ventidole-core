import { ApiProperty } from '@nestjs/swagger';

/**
 * Shop Response DTO
 *
 * Response DTO for shop data.
 */
export class ShopResponseDto {
  @ApiProperty({ example: 'shop_abc123' })
  id: string;

  @ApiProperty({ example: 'user_xyz789' })
  ownerId: string;

  @ApiProperty({ example: 'K-Pop Official Store' })
  name: string;

  @ApiProperty({ example: 'Official merchandise store for K-Pop group', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'https://example.com/logo.jpg', nullable: true })
  logoUrl: string | null;

  @ApiProperty({ example: 'https://example.com/banner.jpg', nullable: true })
  bannerUrl: string | null;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-15T08:30:00Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-20T14:45:00Z' })
  updatedAt: Date;
}
