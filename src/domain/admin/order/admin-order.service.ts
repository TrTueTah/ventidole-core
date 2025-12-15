import { Injectable } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { OrderStatus } from 'src/db/prisma/enums';
import { CreateOrderDto } from './dto/create-order.dto';
import { GetOrdersDto } from './dto/get-orders.dto';
import { OrderDetailDto } from './dto/order-detail.dto';
import { OrderDto } from './dto/order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class AdminOrderService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllOrders(
    filters: GetOrdersDto,
  ): Promise<PaginationResponse<OrderDto>> {
    const {
      offset,
      limit,
      page,
      search,
      userId,
      status,
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

    // Add status filter
    if (status) {
      whereClause.status = status;
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

    const { items, ...orderWithoutItems } = order;
    return {
      ...orderWithoutItems,
      itemCount: items.length,
    };
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
