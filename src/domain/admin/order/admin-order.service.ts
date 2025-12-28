import { Injectable, Logger } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { GetStreamNotificationService } from '@shared/service/getstream-notification/getstream-notification.service';
import { KnockWorkflowService } from '@shared/service/knock-workflow/knock-workflow.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { OrderStatus } from 'src/db/prisma/enums';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import { OrderDto } from './dto/order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class AdminOrderService {
  private readonly logger = new Logger(AdminOrderService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knockWorkflowService: KnockWorkflowService,
    private readonly getStreamNotificationService: GetStreamNotificationService,
  ) {}

  async getAllOrders(
    filters: GetOrdersDto,
  ): Promise<PaginationResponse<OrderDto>> {
    const {
      offset,
      limit,
      page,
      search,
      userId,
      orderStatus,
      paymentStatus,
      paymentMethod,
      isActive,
      sortBy,
      sortOrder,
    } = filters;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
    };

    // Add search filter
    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { user: { username: { contains: search, mode: 'insensitive' } } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Add user filter
    if (userId) {
      whereClause.userId = userId;
    }

    // Add order status filter
    if (orderStatus) {
      whereClause.status = orderStatus;
    }

    // Add payment status filter
    if (paymentStatus) {
      whereClause.paymentTransactions = {
        some: {
          status: paymentStatus,
        },
      };
    }

    // Add payment method filter
    if (paymentMethod) {
      whereClause.paymentMethod = paymentMethod;
    }

    // Add active status filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Build orderBy clause
    const orderByClause: Record<string, string> = {};
    const validSortFields = ['createdAt', 'updatedAt', 'totalAmount', 'paidAt'];

    if (sortBy && validSortFields.includes(sortBy)) {
      orderByClause[sortBy] = sortOrder || 'desc';
    } else {
      orderByClause.createdAt = 'desc';
    }

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where: whereClause,
        select: {
          id: true,
          user: {
            select: {
              id: true,
              username: true,
              email: true,
              avatarUrl: true,
            },
          },
          totalAmount: true,
          status: true,
          paymentMethod: true,
          paidAt: true,
          paymentTransactions: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 1,
            select: {
              status: true,
            },
          },
          items: {
            select: {
              id: true,
            },
          },
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: orderByClause,
        skip: offset,
        take: limit,
      }),
      this.prisma.order.count({
        where: whereClause,
      }),
    ]);

    const ordersWithCount = orders.map((order) => ({
      ...order,
      paymentStatus: order.paymentTransactions[0]?.status || null,
      paymentTransactions: undefined,
      itemCount: order.items.length,
      items: undefined,
    }));

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(ordersWithCount, pageInfo);
  }

  async getOrderById(id: string): Promise<OrderDetailDto> {
    const order = await this.prisma.order.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        totalAmount: true,
        status: true,
        shippingAddress: true,
        paymentMethod: true,
        paidAt: true,
        items: {
          select: {
            id: true,
            productId: true,
            product: {
              select: {
                name: true,
              },
            },
            variantId: true,
            variant: {
              select: {
                name: true,
              },
            },
            price: true,
            quantity: true,
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
        version: true,
        metadata: true,
      },
    });

    if (!order) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Order not found',
      });
    }

    const items = order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productName: item.product.name,
      variantId: item.variantId,
      variantName: item.variant?.name || null,
      price: item.price,
      quantity: item.quantity,
    }));

    return {
      ...order,
      items,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: order.metadata as Record<string, any> | null,
    };
  }

  async createOrder(createOrderDto: CreateOrderDto): Promise<OrderDto> {
    // Verify user exists
    const user = await this.prisma.user.findUnique({
      where: {
        id: createOrderDto.userId,
      },
      select: {
        id: true,
        isDeleted: true,
        isActive: true,
      },
    });

    if (!user || user.isDeleted || !user.isActive) {
      throw new CustomError(ErrorCode.UserNotFound);
    }

    // Verify all products exist
    for (const item of createOrderDto.items) {
      const product = await this.prisma.product.findUnique({
        where: {
          id: item.productId,
        },
        select: {
          id: true,
          isDeleted: true,
          isActive: true,
        },
      });

      if (!product || product.isDeleted || !product.isActive) {
        throw new CustomError(ErrorCode.ValidationFailed, {
          message: `Product ${item.productId} not found`,
        });
      }

      // Verify variant if provided
      if (item.variantId) {
        const variant = await this.prisma.productVariant.findUnique({
          where: {
            id: item.variantId,
          },
          select: {
            id: true,
            isDeleted: true,
            isActive: true,
          },
        });

        if (!variant || variant.isDeleted || !variant.isActive) {
          throw new CustomError(ErrorCode.ValidationFailed, {
            message: `Variant ${item.variantId} not found`,
          });
        }
      }
    }

    const order = await this.prisma.order.create({
      data: {
        userId: createOrderDto.userId,
        totalAmount: createOrderDto.totalAmount,
        status: createOrderDto.status || OrderStatus.pending,
        shippingAddress: createOrderDto.shippingAddress,
        paymentMethod: createOrderDto.paymentMethod,
        items: {
          create: createOrderDto.items.map((item) => ({
            productId: item.productId,
            variantId: item.variantId,
            price: item.price,
            quantity: item.quantity,
          })),
        },
      },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        totalAmount: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
        items: {
          select: {
            id: true,
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const { items, ...orderWithoutItems } = order;
    return {
      ...orderWithoutItems,
      itemCount: items.length,
    };
  }

  async updateOrder(
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderDto> {
    // Check if order exists
    const existingOrder = await this.prisma.order.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingOrder) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Order not found',
      });
    }

    // If status is being updated to paid, set paidAt
    const updateData: Record<string, unknown> = {};

    if (updateOrderDto.status) {
      updateData.status = updateOrderDto.status;
      if (updateOrderDto.status === OrderStatus.paid && !existingOrder.paidAt) {
        updateData.paidAt = new Date();
      }
    }

    if (updateOrderDto.shippingAddress !== undefined) {
      updateData.shippingAddress = updateOrderDto.shippingAddress;
    }

    if (updateOrderDto.paymentMethod !== undefined) {
      updateData.paymentMethod = updateOrderDto.paymentMethod;
    }

    if (updateOrderDto.isActive !== undefined) {
      updateData.isActive = updateOrderDto.isActive;
    }

    const order = await this.prisma.order.update({
      where: {
        id,
      },
      data: updateData,
      select: {
        id: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        totalAmount: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
        items: {
          select: {
            id: true,
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send notifications if status changed
    if (
      updateOrderDto.status &&
      updateOrderDto.status !== existingOrder.status
    ) {
      try {
        const orderCode = String(order.id.slice(-12)); // Use last 12 chars of ID as order code

        // Notify on status changes
        if (updateOrderDto.status === OrderStatus.shipping) {
          // Order shipped notification
          await this.knockWorkflowService.notifyOrderShipped({
            userId: order.user.id,
            orderId: order.id,
            orderCode,
          });

          await this.getStreamNotificationService.emitOrderStatusEvent({
            userId: order.user.id,
            orderId: order.id,
            orderCode,
            status: 'shipped',
          });

          this.logger.log(
            `Order shipped notification sent for order ${order.id}`,
          );
        } else if (updateOrderDto.status === OrderStatus.delivered) {
          // Order delivered notification
          await this.knockWorkflowService.notifyOrderDelivered({
            userId: order.user.id,
            orderId: order.id,
            orderCode,
          });

          await this.getStreamNotificationService.emitOrderStatusEvent({
            userId: order.user.id,
            orderId: order.id,
            orderCode,
            status: 'delivered',
          });

          this.logger.log(
            `Order delivered notification sent for order ${order.id}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to send order status notification: ${error.message}`,
        );
        // Don't throw - notification failure shouldn't block order update
      }
    }

    const { items, ...orderWithoutItems } = order;
    return {
      ...orderWithoutItems,
      itemCount: items.length,
    };
  }

  async changeOrderStatus(
    id: string,
    changeOrderStatusDto: ChangeOrderStatusDto,
  ): Promise<OrderDto> {
    // Check if order exists
    const existingOrder = await this.prisma.order.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        status: true,
        paidAt: true,
        userId: true,
      },
    });

    if (!existingOrder) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Order not found',
      });
    }

    // Validate status transition
    const { status: newStatus, note } = changeOrderStatusDto;
    this.validateStatusTransition(existingOrder.status, newStatus);

    // Prepare update data
    const updateData: Record<string, unknown> = {
      status: newStatus,
    };

    // Set paidAt when transitioning to PAID status
    if (newStatus === OrderStatus.PAID && !existingOrder.paidAt) {
      updateData.paidAt = new Date();
    }

    // Add note to metadata if provided
    if (note) {
      updateData.metadata = {
        statusChangeNote: note,
        statusChangedAt: new Date().toISOString(),
      };
    }

    const order = await this.prisma.order.update({
      where: {
        id,
      },
      data: updateData,
      select: {
        id: true,
        user: {
          select: {
            id: true,
            username: true,
            email: true,
            avatarUrl: true,
          },
        },
        totalAmount: true,
        status: true,
        paymentMethod: true,
        paidAt: true,
        paymentTransactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
          select: {
            status: true,
          },
        },
        items: {
          select: {
            id: true,
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Send notifications for status changes
    if (newStatus !== existingOrder.status) {
      try {
        const orderCode = String(order.id.slice(-12));

        if (newStatus === OrderStatus.CONFIRMED) {
          this.logger.log(
            `Order confirmed notification could be sent for order ${order.id}`,
          );
        } else if (newStatus === OrderStatus.SHIPPING) {
          await this.knockWorkflowService.notifyOrderShipped({
            userId: order.user.id,
            orderId: order.id,
            orderCode,
          });

          await this.getStreamNotificationService.emitOrderStatusEvent({
            userId: order.user.id,
            orderId: order.id,
            orderCode,
            status: 'shipped',
          });

          this.logger.log(
            `Order shipped notification sent for order ${order.id}`,
          );
        } else if (newStatus === OrderStatus.DELIVERED) {
          await this.knockWorkflowService.notifyOrderDelivered({
            userId: order.user.id,
            orderId: order.id,
            orderCode,
          });

          await this.getStreamNotificationService.emitOrderStatusEvent({
            userId: order.user.id,
            orderId: order.id,
            orderCode,
            status: 'delivered',
          });

          this.logger.log(
            `Order delivered notification sent for order ${order.id}`,
          );
        } else if (newStatus === OrderStatus.CANCELED) {
          this.logger.log(
            `Order canceled notification could be sent for order ${order.id}`,
          );
        }
      } catch (error) {
        this.logger.error(
          `Failed to send order status notification: ${error.message}`,
        );
      }
    }

    const { items, paymentTransactions, ...orderWithoutItems } = order;
    return {
      ...orderWithoutItems,
      paymentStatus: paymentTransactions[0]?.status || null,
      itemCount: items.length,
    };
  }

  private validateStatusTransition(
    currentStatus: OrderStatus,
    newStatus: OrderStatus,
  ): void {
    // Define valid transitions
    const validTransitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.PENDING_PAYMENT]: [
        OrderStatus.CONFIRMED,
        OrderStatus.PAID,
        OrderStatus.CANCELED,
        OrderStatus.EXPIRED,
      ],
      [OrderStatus.CONFIRMED]: [
        OrderStatus.PAID,
        OrderStatus.SHIPPING,
        OrderStatus.CANCELED,
      ],
      [OrderStatus.PAID]: [
        OrderStatus.SHIPPING,
        OrderStatus.DELIVERED,
        OrderStatus.CANCELED,
      ],
      [OrderStatus.SHIPPING]: [OrderStatus.DELIVERED, OrderStatus.CANCELED],
      [OrderStatus.DELIVERED]: [], // Final state
      [OrderStatus.CANCELED]: [], // Final state
      [OrderStatus.EXPIRED]: [], // Final state
    };

    const allowedStatuses = validTransitions[currentStatus] || [];

    if (!allowedStatuses.includes(newStatus)) {
      throw new CustomError(ErrorCode.ValidationFailed, {
        message: `Invalid status transition from ${currentStatus} to ${newStatus}`,
      });
    }
  }

  async deleteOrder(id: string): Promise<void> {
    // Check if order exists
    const existingOrder = await this.prisma.order.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingOrder) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Order not found',
      });
    }

    // Soft delete
    await this.prisma.order.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
