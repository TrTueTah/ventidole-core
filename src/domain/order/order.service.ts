import { Injectable } from '@nestjs/common';

import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { WinstonLogger } from '@shared/service/logger/winston.logger';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { Prisma } from 'src/db/prisma/client';
import {
  OrderStatus,
  PaymentMethod,
  PaymentTransactionStatus,
} from 'src/db/prisma/enums';
import { ConfirmOrderDto } from './dto/confirm-order.dto';
import { OrderResponseDto, PaymentInfoDto } from './dto/order-response.dto';
import { PaymentTransactionService } from './payment-transaction.service';

@Injectable()
export class OrderService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paymentTransactionService: PaymentTransactionService,
  ) {}

  /**
   * Confirm order and create payment if needed
   * Entry point for order creation
   * @param userId User UUID
   * @param dto Order confirmation data
   * @returns Order response with payment info if CREDIT
   */
  async confirmOrder(
    userId: string,
    dto: ConfirmOrderDto,
  ): Promise<OrderResponseDto> {
    // Validate and calculate order
    const { items, totalAmount, orderItems } =
      await this.validateAndCalculateOrder(dto.items);

    if (items.length === 0) {
      throw new CustomError(ErrorCode.OrderItemsEmpty);
    }

    // Get shipping address (in real app, fetch from database)
    // For now, using placeholder
    const shippingAddress = {
      id: dto.shippingAddressId,
      // Add other address fields as needed
    };

    // Create order with appropriate initial status
    const initialStatus =
      dto.paymentMethod === PaymentMethod.CREDIT
        ? OrderStatus.PENDING_PAYMENT
        : OrderStatus.CONFIRMED;

    const order = await this.prisma.order.create({
      data: {
        userId,
        totalAmount,
        status: initialStatus,
        paymentMethod: dto.paymentMethod,
        shippingAddress: shippingAddress as Prisma.InputJsonValue,
        items: {
          create: orderItems,
        },
      },
      include: {
        items: true,
      },
    });

    WinstonLogger.info('Order created', {
      metadata: {
        orderId: order.id,
        userId,
        totalAmount,
        paymentMethod: dto.paymentMethod,
        status: order.status,
      },
    });

    // Handle payment method branching
    if (dto.paymentMethod === PaymentMethod.CREDIT) {
      // Create payment transaction and get PayOS link
      const transaction =
        await this.paymentTransactionService.createPaymentTransaction(
          order.id,
          userId,
          totalAmount,
          `Payment for order #${order.id}`,
        );

      return {
        orderId: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        payment: {
          provider: 'PAYOS',
          orderCode: transaction.orderCode,
          paymentLinkId: transaction.paymentLinkId!,
          checkoutUrl: transaction.checkoutUrl!,
          qrCode: transaction.qrCode!,
        },
        createdAt: order.createdAt,
      };
    } else {
      // COD - no payment needed
      return {
        orderId: order.id,
        status: order.status,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt,
      };
    }
  }

  /**
   * Retry payment for PENDING_PAYMENT order
   * @param userId User UUID
   * @param orderId Order UUID
   * @returns New payment info
   */
  async retryPayment(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    // Fetch order
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new CustomError(ErrorCode.OrderNotFound);
    }

    if (order.userId !== userId) {
      throw new CustomError(ErrorCode.OrderAccessDenied);
    }

    if (
      order.status !== OrderStatus.PENDING_PAYMENT ||
      order.paymentMethod !== PaymentMethod.CREDIT
    ) {
      throw new CustomError(ErrorCode.OrderCannotRetryPayment);
    }

    // Check if there's already a PAID transaction
    const latestTransaction =
      await this.paymentTransactionService.getLatestTransactionForOrder(
        orderId,
      );

    if (latestTransaction?.status === PaymentTransactionStatus.PAID) {
      throw new CustomError(ErrorCode.OrderAlreadyPaid);
    }

    // Expire old pending transactions
    await this.paymentTransactionService.expirePendingTransactions(orderId);

    // Create new payment transaction
    const transaction =
      await this.paymentTransactionService.createPaymentTransaction(
        order.id,
        userId,
        order.totalAmount,
        `Retry payment for order #${order.id}`,
      );

    WinstonLogger.info('Payment retry initiated', {
      metadata: {
        orderId,
        userId,
        newOrderCode: transaction.orderCode,
      },
    });

    return {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      payment: {
        provider: 'PAYOS',
        orderCode: transaction.orderCode,
        paymentLinkId: transaction.paymentLinkId!,
        checkoutUrl: transaction.checkoutUrl!,
        qrCode: transaction.qrCode!,
      },
      createdAt: order.createdAt,
    };
  }

  /**
   * Get order status (for frontend polling)
   * @param userId User UUID
   * @param orderId Order UUID
   * @returns Order response
   */
  async getOrderStatus(
    userId: string,
    orderId: string,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new CustomError(ErrorCode.OrderNotFound);
    }

    if (order.userId !== userId) {
      throw new CustomError(ErrorCode.OrderAccessDenied);
    }

    // If CREDIT and PENDING_PAYMENT, include latest payment info
    let payment: PaymentInfoDto | undefined;

    if (
      order.paymentMethod === PaymentMethod.CREDIT &&
      order.status === OrderStatus.PENDING_PAYMENT
    ) {
      const transaction =
        await this.paymentTransactionService.getLatestTransactionForOrder(
          orderId,
        );
      if (
        transaction &&
        transaction.status === PaymentTransactionStatus.PENDING
      ) {
        payment = {
          provider: 'PAYOS',
          orderCode: transaction.orderCode,
          paymentLinkId: transaction.paymentLinkId!,
          checkoutUrl: transaction.checkoutUrl!,
          qrCode: transaction.qrCode!,
        };
      }
    }

    return {
      orderId: order.id,
      status: order.status,
      paymentMethod: order.paymentMethod,
      totalAmount: order.totalAmount,
      payment,
      createdAt: order.createdAt,
    };
  }

  /**
   * Handle successful payment webhook
   * Updates order status to PAID
   * @param orderCode PayOS orderCode
   */
  async handlePaymentSuccess(orderCode: number): Promise<void> {
    // Update payment transaction status (idempotent)
    const transaction =
      await this.paymentTransactionService.updateTransactionStatus(
        orderCode,
        PaymentTransactionStatus.PAID,
        new Date(),
      );

    // Update order status to PAID
    const order = await this.prisma.order.findUnique({
      where: { id: transaction.orderId },
    });

    if (!order) {
      WinstonLogger.error('Order not found for paid transaction', {
        metadata: { orderId: transaction.orderId, orderCode },
      });
      throw new CustomError(ErrorCode.OrderNotFound);
    }

    // Idempotency check
    if (order.status === OrderStatus.PAID) {
      WinstonLogger.info('Order already marked as PAID - idempotent handling', {
        metadata: { orderId: order.id, orderCode },
      });
      return;
    }

    // Update order to PAID
    await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.PAID,
        paidAt: new Date(),
      },
    });

    WinstonLogger.info('Order marked as PAID', {
      metadata: {
        orderId: order.id,
        orderCode,
        userId: order.userId,
        amount: order.totalAmount,
      },
    });

    // Trigger business logic (e.g., notifications, inventory, etc.)
    await this.triggerPostPaymentLogic(order.id);
  }

  /**
   * Validate order items and calculate total
   * @param items Order items from DTO
   * @returns Validated items, total amount, and order item data
   */
  private async validateAndCalculateOrder(
    items: ConfirmOrderDto['items'],
  ): Promise<{
    items: any[];
    totalAmount: number;
    orderItems: any[];
  }> {
    const productIds = items.map((item) => item.productId);

    // Fetch products with variants
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        isDeleted: false,
        isActive: true,
      },
      include: {
        variants: true,
      },
    });

    if (products.length !== items.length) {
      throw new CustomError(ErrorCode.OrderProductInvalid);
    }

    let totalAmount = 0;
    const orderItems: any[] = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.productId);
      if (!product) {
        throw new CustomError(
          ErrorCode.OrderProductUnavailable,
          item.productId,
        );
      }

      // Check stock
      if (item.variantId) {
        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new CustomError(ErrorCode.OrderVariantNotFound, item.variantId);
        }
        if (variant.stock < item.quantity) {
          throw new CustomError(ErrorCode.OrderInsufficientStock, variant.name);
        }
        totalAmount += variant.price * item.quantity;
        orderItems.push({
          productId: product.id,
          variantId: variant.id,
          price: variant.price,
          quantity: item.quantity,
        });
      } else {
        if (product.stock < item.quantity) {
          throw new CustomError(ErrorCode.OrderInsufficientStock, product.name);
        }
        totalAmount += product.price * item.quantity;
        orderItems.push({
          productId: product.id,
          price: product.price,
          quantity: item.quantity,
        });
      }
    }

    return { items: products, totalAmount, orderItems };
  }

  /**
   * Trigger post-payment business logic
   * @param orderId Order UUID
   */
  private async triggerPostPaymentLogic(orderId: string): Promise<void> {
    // TODO: Implement business logic:
    // - Decrease product stock
    // - Send confirmation email
    // - Trigger fulfillment
    // - Send push notification
    // - Update analytics
    WinstonLogger.info('Post-payment logic triggered', {
      metadata: { orderId },
    });
  }

  /**
   * Expire old PENDING_PAYMENT orders (cron job or scheduled task)
   * @param timeoutMinutes Timeout threshold in minutes (default 30)
   */
  async expireOldPendingOrders(timeoutMinutes: number = 30): Promise<void> {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    const expiredOrders = await this.prisma.order.updateMany({
      where: {
        status: OrderStatus.PENDING_PAYMENT,
        createdAt: { lt: cutoffTime },
      },
      data: {
        status: OrderStatus.EXPIRED,
      },
    });

    WinstonLogger.info('Expired old pending orders', {
      metadata: { count: expiredOrders.count, timeoutMinutes },
    });
  }
}
