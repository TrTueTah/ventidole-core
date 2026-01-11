import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { EventBus } from '@core/event/event-bus.service';
import { OrderRepository } from '@domain/commerce/order/order.repository';
import { OrderAggregate } from '@domain/commerce/order/order.aggregate';
import { OrderId } from '@domain/shared/value-objects/order-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';

/**
 * Order Repository Prisma Implementation
 *
 * Implements OrderRepository interface using Prisma ORM.
 *
 * Responsibilities:
 * - Map between domain aggregates and Prisma models
 * - Persist and retrieve orders
 * - Sync order items
 * - Publish domain events after persistence
 */
@Injectable()
export class OrderRepositoryPrisma implements OrderRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async save(order: OrderAggregate): Promise<void> {
    const data = this.toPersistence(order);

    // Upsert order
    await this.prisma.order.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        customerId: data.customerId,
        shopId: data.shopId,
        status: data.status,
        shippingRecipientName: data.shippingRecipientName,
        shippingPhoneNumber: data.shippingPhoneNumber,
        shippingAddressLine: data.shippingAddressLine,
        shippingWard: data.shippingWard,
        shippingDistrict: data.shippingDistrict,
        shippingProvince: data.shippingProvince,
        shippingPostalCode: data.shippingPostalCode,
        paymentMethod: data.paymentMethod,
        paymentId: data.paymentId,
        paymentOrderCode: data.paymentOrderCode,
        checkoutUrl: data.checkoutUrl,
        qrCode: data.qrCode,
        paidAt: data.paidAt,
        trackingNumber: data.trackingNumber,
        cancelReason: data.cancelReason,
        totalAmount: data.totalAmount,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      },
      update: {
        status: data.status,
        paymentId: data.paymentId,
        paymentOrderCode: data.paymentOrderCode,
        checkoutUrl: data.checkoutUrl,
        qrCode: data.qrCode,
        paidAt: data.paidAt,
        trackingNumber: data.trackingNumber,
        cancelReason: data.cancelReason,
        updatedAt: data.updatedAt,
      },
    });

    // Sync order items
    await this.syncOrderItems(order);

    // Publish domain events
    const events = order.domainEvents;
    for (const event of events) {
      await this.eventBus.publish(event);
    }

    order.clearDomainEvents();
  }

  async findById(id: OrderId): Promise<OrderAggregate | null> {
    const order = await this.prisma.order.findUnique({
      where: { id: id.value },
      include: {
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return this.fromPersistence(order);
  }

  async findByCustomer(
    customerId: UserId,
    params: { page: number; limit: number; status?: string },
  ): Promise<{ orders: OrderAggregate[]; total: number }> {
    const where: any = {
      customerId: customerId.value,
    };

    if (params.status) {
      where.status = params.status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            select: {
              productId: true,
              productName: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.fromPersistence(o)),
      total,
    };
  }

  async findByShop(
    shopId: string,
    params: { page: number; limit: number; status?: string },
  ): Promise<{ orders: OrderAggregate[]; total: number }> {
    const where: any = {
      shopId,
    };

    if (params.status) {
      where.status = params.status;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            select: {
              productId: true,
              productName: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.fromPersistence(o)),
      total,
    };
  }

  async findAll(params: {
    page: number;
    limit: number;
    status?: string;
    customerId?: string;
    shopId?: string;
  }): Promise<{ orders: OrderAggregate[]; total: number }> {
    const where: any = {};

    if (params.status) {
      where.status = params.status;
    }

    if (params.customerId) {
      where.customerId = params.customerId;
    }

    if (params.shopId) {
      where.shopId = params.shopId;
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            select: {
              productId: true,
              productName: true,
              quantity: true,
              unitPrice: true,
            },
          },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      orders: orders.map((o) => this.fromPersistence(o)),
      total,
    };
  }

  /**
   * Sync order items between aggregate and database
   */
  private async syncOrderItems(order: OrderAggregate): Promise<void> {
    const orderId = order.id.value;
    const currentItems = order.getItems();

    // For orders, items are immutable after creation, so we only create them once
    const existingItems = await this.prisma.orderItem.findMany({
      where: { orderId },
      select: { productId: true },
    });

    if (existingItems.length === 0 && currentItems.length > 0) {
      // Create order items (only on order creation)
      await this.prisma.orderItem.createMany({
        data: currentItems.map((item) => ({
          orderId,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice.amount,
        })),
      });
    }
  }

  /**
   * Map from Prisma model to domain aggregate
   */
  private fromPersistence(data: any): OrderAggregate {
    return OrderAggregate.fromPersistence({
      id: data.id,
      customerId: data.customerId,
      shopId: data.shopId,
      status: data.status,
      shippingAddress: {
        recipientName: data.shippingRecipientName,
        phoneNumber: data.shippingPhoneNumber,
        addressLine: data.shippingAddressLine,
        ward: data.shippingWard,
        district: data.shippingDistrict,
        province: data.shippingProvince,
        postalCode: data.shippingPostalCode,
      },
      paymentMethod: data.paymentMethod,
      paymentId: data.paymentId,
      paymentOrderCode: data.paymentOrderCode,
      checkoutUrl: data.checkoutUrl,
      qrCode: data.qrCode,
      paidAt: data.paidAt,
      trackingNumber: data.trackingNumber,
      cancelReason: data.cancelReason,
      totalAmount: data.totalAmount,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
      items: data.items || [],
    });
  }

  /**
   * Map from domain aggregate to Prisma model
   */
  private toPersistence(order: OrderAggregate): any {
    return {
      id: order.id.value,
      customerId: order.customerId.value,
      shopId: order.shopId,
      status: order.status.value,
      shippingRecipientName: order.shippingAddress.recipientName,
      shippingPhoneNumber: order.shippingAddress.phoneNumber,
      shippingAddressLine: order.shippingAddress.addressLine,
      shippingWard: order.shippingAddress.ward,
      shippingDistrict: order.shippingAddress.district,
      shippingProvince: order.shippingAddress.province,
      shippingPostalCode: order.shippingAddress.postalCode,
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

  async findByPaymentOrderCode(orderCode: number): Promise<OrderAggregate | null> {
    const order = await this.prisma.order.findFirst({
      where: { paymentOrderCode: orderCode },
      include: {
        items: {
          select: {
            productId: true,
            productName: true,
            quantity: true,
            unitPrice: true,
          },
        },
      },
    });

    if (!order) {
      return null;
    }

    return this.fromPersistence(order);
  }
}
