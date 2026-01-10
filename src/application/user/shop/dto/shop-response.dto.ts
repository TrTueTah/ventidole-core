/**
 * Shop Response DTO
 *
 * Response DTO for shop data.
 */
export class ShopResponseDto {
  id: string;
  ownerId: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  bannerUrl: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}
