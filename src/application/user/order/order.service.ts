import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
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
import { PayOSService } from '@infra/payos/payos.service';
import { ConfigService } from '@nestjs/config';
import { CartApplicationService } from '@application/user/cart/cart.service';
import { PrismaService } from '@infra/prisma/prisma.service';
import { KnockService } from '@infra/knock/knock.service';

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
  private readonly logger = new Logger(OrderApplicationService.name);

  constructor(
    @Inject('OrderRepository')
    private readonly orderRepository: OrderRepository,
    private readonly canViewOrder: CanViewOrderPolicy,
    private readonly canManageOrder: CanManageOrderPolicy,
    private readonly canCancelOrder: CanCancelOrderPolicy,
    private readonly payosService: PayOSService,
    private readonly configService: ConfigService,
    private readonly cartService: CartApplicationService,
    private readonly prisma: PrismaService,
    private readonly knockService: KnockService,
  ) {}

  /**
   * Create new order with payment processing
   * CREDIT: Creates PayOS payment link, returns QR code
   * COD: Confirms order immediately, no payment needed
   */
  async createOrder(
    customerId: string,
    dto: CreateOrderDto,
  ): Promise<OrderResponseDto> {
    // Validate shop exists and is active
    await this.validateShop(dto.shopId);

    // Validate products exist and have sufficient stock
    await this.validateOrderItems(dto.shopId, dto.items);

    // Create aggregate (status: PENDING_PAYMENT)
    const order = OrderAggregate.create({
      customerId,
      shopId: dto.shopId,
      items: dto.items,
      shippingAddress: dto.shippingAddress,
      paymentMethod: dto.paymentMethod,
    });

    // Handle payment method branching
    if (dto.paymentMethod === 'CREDIT') {
      // Create PayOS payment link
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const paymentOrderCode = Date.now(); // Unique order code

      const paymentResponse = await this.payosService.createPayment({
        orderCode: paymentOrderCode,
        amount: order.totalAmount.amount,
        description: `Order payment - ${order.id.value.substring(0, 8)}`,
        returnUrl: `${frontendUrl}/payment/success/${order.id.value}`,
        cancelUrl: `${frontendUrl}/payment/cancel/${order.id.value}`,
      });

      // Set payment details in aggregate
      order.setPaymentDetails(
        paymentOrderCode,
        paymentResponse.checkoutUrl,
        paymentResponse.qrCode,
      );

      this.logger.log(
        `CREDIT order created with PayOS payment: orderId=${order.id.value}, paymentOrderCode=${paymentOrderCode}`,
      );
    } else {
      // COD: Confirm order immediately
      order.confirm();

      this.logger.log(
        `COD order created and confirmed: orderId=${order.id.value}`,
      );

      // Clear cart items for COD orders
      await this.clearUserCart(customerId);

      // Decrease product stock for COD orders
      await this.decreaseProductStock(order);

      // Send order confirmation notification
      await this.sendOrderConfirmation(order);
    }

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
   * Handle payment success from PayOS webhook
   * Called when PayOS confirms payment
   */
  async handlePaymentSuccess(paymentOrderCode: number): Promise<void> {
    this.logger.log(
      `Processing payment success webhook: paymentOrderCode=${paymentOrderCode}`,
    );

    // Find order by paymentOrderCode
    const order = await this.orderRepository.findByPaymentOrderCode(
      paymentOrderCode,
    );

    if (!order) {
      this.logger.warn(
        `Order not found for paymentOrderCode=${paymentOrderCode}`,
      );
      throw new NotFoundException('Order not found');
    }

    // Idempotency check - if already paid, skip
    if (order.status.isPaid()) {
      this.logger.log(
        `Order already paid: orderId=${order.id.value}, paymentOrderCode=${paymentOrderCode}`,
      );
      return;
    }

    // Confirm payment (PENDING_PAYMENT → PAID)
    const paidAt = new Date();
    order.confirmPayment(paidAt);

    // Persist
    await this.orderRepository.save(order);

    this.logger.log(
      `Order payment confirmed: orderId=${order.id.value}, paymentOrderCode=${paymentOrderCode}`,
    );

    // Clear cart items after successful payment
    await this.clearUserCart(order.customerId.value);

    // Decrease product stock
    await this.decreaseProductStock(order);

    // Send payment success notification
    await this.sendPaymentSuccessNotification(order);
  }

  /**
   * Clear user's cart (internal helper)
   */
  private async clearUserCart(userId: string): Promise<void> {
    try {
      await this.cartService.clearCartAfterPayment(userId);
      this.logger.log(`Cart cleared for user: ${userId}`);
    } catch (error) {
      this.logger.error(
        `Failed to clear cart for user ${userId}: ${error.message}`,
      );
      // Don't throw - cart clearing is non-critical
    }
  }

  /**
   * Decrease product stock after payment (internal helper)
   */
  private async decreaseProductStock(order: OrderAggregate): Promise<void> {
    try {
      for (const item of order.getItems()) {
        // Decrease stock for product
        await this.prisma.product.update({
          where: { id: item.productId },
          data: {
            stock: {
              decrement: item.quantity,
            },
          },
        });

        this.logger.log(
          `Stock decreased: productId=${item.productId}, quantity=${item.quantity}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to decrease product stock for order ${order.id.value}: ${error.message}`,
      );
      // Don't throw - stock updates are logged for manual review
    }
  }

  /**
   * Send order confirmation notification (internal helper)
   */
  private async sendOrderConfirmation(order: OrderAggregate): Promise<void> {
    try {
      await this.knockService.triggerWorkflow(
        'confirm-order',
        [order.customerId.value],
        {
          title: 'Order Confirmed',
          text: `Your order ${order.id.value.substring(0, 8)} has been confirmed.`,
          orderId: order.id.value,
          totalAmount: order.totalAmount.amount,
          shopId: order.shopId,
          paymentMethod: order.paymentMethod.value,
          url: `/orders/${order.id.value}`,
        },
        { id: 'system', name: 'Ventidole' },
      );
      this.logger.log(`Order confirmation sent: orderId=${order.id.value}`);
    } catch (error) {
      this.logger.error(
        `Failed to send order confirmation for ${order.id.value}: ${error.message}`,
      );
      // Don't throw - notification is non-critical
    }
  }

  /**
   * Send payment success notification (internal helper)
   */
  private async sendPaymentSuccessNotification(
    order: OrderAggregate,
  ): Promise<void> {
    try {
      await this.knockService.triggerWorkflow(
        'payment-success',
        [order.customerId.value],
        {
          orderId: order.id.value,
          orderCode: order.id.value.substring(0, 8),
          amount: order.totalAmount.amount,
          paymentMethod: order.paymentMethod.value,
          paidAt: order.paidAt,
          url: `/orders/${order.id.value}`,
        },
        { id: 'system', name: 'Ventidole' },
      );
      this.logger.log(
        `Payment success notification sent: orderId=${order.id.value}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to send payment success notification for ${order.id.value}: ${error.message}`,
      );
      // Don't throw - notification is non-critical
    }
  }

  /**
   * Validate shop exists and is active (internal helper)
   */
  private async validateShop(shopId: string): Promise<void> {
    const shop = await this.prisma.shop.findUnique({
      where: { id: shopId },
      select: {
        id: true,
        name: true,
        isActive: true,
        isDeleted: true,
      },
    });

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    if (shop.isDeleted) {
      throw new BadRequestException('Shop has been deleted');
    }

    if (!shop.isActive) {
      throw new BadRequestException(`Shop "${shop.name}" is not active`);
    }
  }

  /**
   * Validate order items (products, variants, stock) (internal helper)
   */
  private async validateOrderItems(
    shopId: string,
    items: Array<{ productId: string; variantId?: string; quantity: number }>,
  ): Promise<void> {
    const productIds = items.map((item) => item.productId);

    // Fetch all products in one query (batch optimization)
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        shopId: true,
        stock: true,
        isActive: true,
        isDeleted: true,
        variants: {
          select: {
            id: true,
            stock: true,
          },
        },
      },
    });

    // Create map for O(1) lookup
    const productMap = new Map(products.map((p) => [p.id, p]));

    // Validate each item
    for (const item of items) {
      const product = productMap.get(item.productId);

      // Check product exists
      if (!product) {
        throw new NotFoundException(`Product not found: ${item.productId}`);
      }

      // Check product is active
      if (!product.isActive) {
        throw new BadRequestException(`Product "${product.name}" is not active`);
      }

      // Check product not deleted
      if (product.isDeleted) {
        throw new BadRequestException(`Product "${product.name}" has been deleted`);
      }

      // Check product belongs to shop
      if (product.shopId !== shopId) {
        throw new BadRequestException(
          `Product "${product.name}" does not belong to this shop`,
        );
      }

      // Check stock availability
      if (item.variantId) {
        // Validate variant exists
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new NotFoundException(
            `Variant not found for product "${product.name}"`,
          );
        }

        // Check variant stock
        if (variant.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Available: ${variant.stock}, Requested: ${item.quantity}`,
          );
        }
      } else {
        // Check product stock
        if (product.stock < item.quantity) {
          throw new BadRequestException(
            `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
          );
        }
      }
    }
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
      paymentOrderCode: order.paymentOrderCode,
      checkoutUrl: order.checkoutUrl,
      qrCode: order.qrCode,
      paidAt: order.paidAt,
      trackingNumber: order.trackingNumber,
      cancelReason: order.cancelReason,
      totalAmount: order.totalAmount.amount,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    };
  }
}
