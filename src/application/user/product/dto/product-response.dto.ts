/**
 * Product Variant Response DTO
 */
export class ProductVariantResponseDto {
  id: string;
  name: string;
  price: number;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product Response DTO
 *
 * Response DTO for product data.
 */
export class ProductResponseDto {
  id: string;
  shopId: string;
  name: string;
  description: string | null;
  basePrice: number;
  imageUrls: string[];
  category: string | null;
  variants: ProductVariantResponseDto[];
  isActive: boolean;
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
