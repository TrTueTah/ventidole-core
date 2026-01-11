import { CartAggregate } from './cart.aggregate';
import { CartId } from '@domain/shared/value-objects/cart-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';

/**
 * Cart Repository Interface
 *
 * Defines persistence operations for Cart aggregate.
 *
 * Note: This is a PURE INTERFACE - no implementation details.
 * Implementation will be in infrastructure layer (Prisma).
 */
export interface CartRepository {
  /**
   * Save (create or update) a cart
   */
  save(cart: CartAggregate): Promise<void>;

  /**
   * Find cart by ID
   */
  findById(id: CartId): Promise<CartAggregate | null>;

  /**
   * Find active cart by user ID
   * Returns null if user has no active cart
   */
  findByUser(userId: UserId): Promise<CartAggregate | null>;

  /**
   * Check if user has an active cart
   */
  existsByUser(userId: UserId): Promise<boolean>;

  /**
   * Delete cart (soft delete)
   */
  delete(id: CartId): Promise<void>;
}
