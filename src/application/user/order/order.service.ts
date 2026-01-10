import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@application/shared/dto/pagination.dto';
import { OrderRepository } from '@domain/commerce/order/order.repository';
import { OrderAggregate } from '@domain/commerce/order/order.aggregate';
import { OrderId } from '@domain/shared/value-objects/order-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import {
  CanViewOrderPolicy,
  CanManageOrderPolicy,
  CanCancelOrderPolicy,
} from '@domain/commerce/order/policies';
import {
  CreateOrderDto,
  OrderResponseDto,
  OrderItemResponseDto,
  ShippingAddressResponseDto,
} from './dto';

/**
 * Order Application Service
 *
 * Orchestrates order use cases.
 *
 * Responsibilities:
 * - Coordinate policies, repositories, and domain logic
 * - Map between DTOs and domain aggregates
 * - Handle application-level concerns
 *
 * Pattern:
 * 1. Check policy
 * 2. Load aggregate
 * 3. Execute business logic
 * 4. Persist
 * 5. Return DTO
 */
@Injectable()
export class OrderApplicationService {
  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: OrderRepository,
    private readonly canViewOrder: CanViewOrderPolicy,
    private readonly canManageOrder: CanManageOrderPolicy,
    private readonly canCancelOrder: CanCancelOrderPolicy,
  ) {}

  /**
   * Create new order
   */
  async createOrder(
    customerId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    // TODO: Verify shop exists and is active
    // TODO: Verify products exist and have sufficient stock

    // Create aggregate
    const order = OrderAggregate.create({
      customerId,
      shopId: dto.shopId,
      items: dto.items,
      shippingAddress: dto.shippingAddress,
      paymentMethod: dto.paymentMethod,
    });

    // Persist
    await this.orderRepository.save(order);

    // Return DTO
    return this.mapToDto(order);
  }

  /**
   * Get order by ID
   */
  async getOrder(userId: string, orderId: string): Promise<OrderResponseDto> {
    // Check policy
    await this.canViewOrder.check(userId, orderId);

    // Load aggregate
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Return DTO
    return this.mapToDto(order);
  }

  /**
   * Confirm order (shop accepts)
   */
  async confirmOrder(userId: string, orderId: string): Promise<OrderResponseDto> {
    // Check policy
    await this.canManageOrder.check(userId, orderId);

    // Load aggregate
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Execute business logic
    order.confirm();

    // Persist
    await this.orderRepository.save(order);

    // Return DTO
    return this.mapToDto(order);
  }

  /**
   * Mark order as paid
   */
  async markOrderAsPaid(
    userId: string,
    orderId: string,
    paymentId: string,
  ): Promise<OrderResponseDto> {
    // Check policy
    await this.canManageOrder.check(userId, orderId);

    // Load aggregate
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Execute business logic
    order.markAsPaid(paymentId);

    // Persist
    await this.orderRepository.save(order);

    // Return DTO
    return this.mapToDto(order);
  }

  /**
   * Ship order
   */
  async shipOrder(
    userId: string,
    orderId: string,
    trackingNumber?: string,
  ): Promise<OrderResponseDto> {
    // Check policy
    await this.canManageOrder.check(userId, orderId);

    // Load aggregate
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Execute business logic
    order.ship(trackingNumber);

    // Persist
    await this.orderRepository.save(order);

    // Return DTO
    return this.mapToDto(order);
  }

  /**
   * Mark order as delivered
   */
  async deliverOrder(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    // Check policy
    await this.canManageOrder.check(userId, orderId);

    // Load aggregate
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Execute business logic
    order.deliver();

    // Persist
    await this.orderRepository.save(order);

    // Return DTO
    return this.mapToDto(order);
  }

  /**
   * Cancel order
   */
  async cancelOrder(
    userId: string,
    orderId: string,
    reason?: string,
  ): Promise<OrderResponseDto> {
    // Check policy
    await this.canCancelOrder.check(userId, orderId);

    // Load aggregate
    const order = await this.orderRepository.findById(
      OrderId.fromString(orderId),
    );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Execute business logic
    order.cancel(reason);

    // Persist
    await this.orderRepository.save(order);

    // Return DTO
    return this.mapToDto(order);
  }

  /**
   * Get orders by customer
   */
  async getOrdersByCustomer(
    customerId: string,
    page: number,
    limit: number,
    status?: string,
  ): Promise<PaginationResponse<OrderResponseDto>> {
    const result = await this.orderRepository.findByCustomer(
      UserId.fromString(customerId),
      { page, limit, status },
    );

    const data = result.orders.map((o) => this.mapToDto(o));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Get orders by shop
   */
  async getOrdersByShop(
    shopId: string,
    page: number,
    limit: number,
    status?: string,
  ): Promise<PaginationResponse<OrderResponseDto>> {
    const result = await this.orderRepository.findByShop(shopId, {
      page,
      limit,
      status,
    });

    const data = result.orders.map((o) => this.mapToDto(o));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Map aggregate to DTO
   */
  private mapToDto(order: OrderAggregate): OrderResponseDto {
    const items: OrderItemResponseDto[] = order.getItems().map((item) => ({
      productId: item.productId,
      productName: item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.amount,
      total: item.total.amount,
    }));

    const shippingAddress: ShippingAddressResponseDto = {
      recipientName: order.shippingAddress.recipientName,
      phoneNumber: order.shippingAddress.phoneNumber,
      addressLine: order.shippingAddress.addressLine,
      ward: order.shippingAddress.ward,
      district: order.shippingAddress.district,
      province: order.shippingAddress.province,
      postalCode: order.shippingAddress.postalCode,
      fullAddress: order.shippingAddress.getFullAddress(),
    };

    return {
      id: order.id.value,
      customerId: order.customerId.value,
      shopId: order.shopId,
      status: order.status.value,
      items,
      shippingAddress,
      paymentMethod: order.paymentMethod.value,
      paymentId: order.paymentId,
      trackingNumber: order.trackingNumber,
      cancelReason: order.cancelReason,
      totalAmount: order.totalAmount.amount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
