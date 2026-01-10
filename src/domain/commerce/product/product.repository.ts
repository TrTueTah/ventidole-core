import { ProductAggregate } from './product.aggregate';
import { ProductId } from '@domain/shared/value-objects/product-id.vo';
import { ShopId } from '@domain/shared/value-objects/shop-id.vo';

/**
 * Product Repository Interface
 *
 * Pure interface for product persistence.
 *
 * Implementation resides in infrastructure layer.
 */
export interface ProductRepository {
  /**
   * Save product (create or update)
   */
  save(product: ProductAggregate): Promise<void>;

  /**
   * Find product by ID
   */
  findById(id: ProductId): Promise<ProductAggregate | null>;

  /**
   * Find products by shop
   */
  findByShop(
    shopId: ShopId,
    params: {
      page: number;
      limit: number;
      category?: string;
      isActive?: boolean;
    },
  ): Promise<{ products: ProductAggregate[]; total: number }>;

  /**
   * Find all products (admin)
   */
  findAll(params: {
    page: number;
    limit: number;
    category?: string;
    shopId?: string;
    isActive?: boolean;
  }): Promise<{ products: ProductAggregate[]; total: number }>;

  /**
   * Search products by name
   */
  searchByName(
    query: string,
    params: {
      page: number;
      limit: number;
      category?: string;
      isActive?: boolean;
    },
  ): Promise<{ products: ProductAggregate[]; total: number }>;
}
