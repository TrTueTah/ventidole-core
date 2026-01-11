import { OrderAggregate } from './order.aggregate';
import { OrderId } from '@domain/shared/value-objects/order-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';

/**
 * Order Repository Interface
 *
 * Defines persistence operations for Order aggregate.
 *
 * Note: This is a PURE INTERFACE - no implementation details.
 * Implementation will be in infrastructure layer (Prisma).
 */
export interface OrderRepository {
  /**
   * Save (create or update) an order
   */
  save(order: OrderAggregate): Promise<void>;

  /**
   * Find order by ID
   */
  findById(id: OrderId): Promise<OrderAggregate | null>;

  /**
   * Find orders by customer
   */
  findByCustomer(
    customerId: UserId,
    params: { page: number; limit: number; status?: string },
  ): Promise<{ orders: OrderAggregate[]; total: number }>;

  /**
   * Find orders by shop
   */
  findByShop(
    shopId: string,
    params: { page: number; limit: number; status?: string },
  ): Promise<{ orders: OrderAggregate[]; total: number }>;

  /**
   * Find all orders with pagination and filters
   */
  findAll(params: {
    page: number;
    limit: number;
    status?: string;
    customerId?: string;
    shopId?: string;
  }): Promise<{
    orders: OrderAggregate[];
    total: number;
  }>;

  /**
   * Find order by PayOS orderCode (for webhook processing)
   */
  findByPaymentOrderCode(orderCode: number): Promise<OrderAggregate | null>;
}
