import { ShopAggregate } from './shop.aggregate';
import { ShopId } from '@domain/shared/value-objects/shop-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';

/**
 * Shop Repository Interface
 *
 * Pure interface for shop persistence.
 *
 * Implementation resides in infrastructure layer.
 */
export interface ShopRepository {
  /**
   * Save shop (create or update)
   */
  save(shop: ShopAggregate): Promise<void>;

  /**
   * Find shop by ID
   */
  findById(id: ShopId): Promise<ShopAggregate | null>;

  /**
   * Find shop by owner
   */
  findByOwner(ownerId: UserId): Promise<ShopAggregate | null>;

  /**
   * Find all shops (admin)
   */
  findAll(params: {
    page: number;
    limit: number;
    isActive?: boolean;
  }): Promise<{ shops: ShopAggregate[]; total: number }>;

  /**
   * Check if user already has a shop
   */
  existsByOwner(ownerId: UserId): Promise<boolean>;
}
