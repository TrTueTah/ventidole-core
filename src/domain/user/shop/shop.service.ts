import { Injectable, Logger } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { CartDto } from './dto/cart.dto';
import { GetShopProductsDto } from './dto/get-shop-products.dto';
import { GetShopsDto } from './dto/get-shops.dto';
import { UserProductDetailDto } from './dto/product-detail.dto';
import { UserProductDto } from './dto/product.dto';
import { ShopListDto } from './dto/shop-list.dto';
import { ShopProductDto } from './dto/shop-product.dto';
import { UserShopDto } from './dto/shop.dto';

@Injectable()
export class ShopService {
  private readonly logger = new Logger(ShopService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getFollowingCommunityShops(userId: string): Promise<ShopListDto[]> {
    // Get the communities that the user is following, ordered by most recently followed
    const followedCommunities = await this.prisma.communityFollower.findMany({
      where: {
        userId,
        isDeleted: false,
        isActive: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 20,
      select: {
        communityId: true,
      },
    });

    const communityIds = followedCommunities.map((cf) => cf.communityId);

    if (communityIds.length === 0) {
      return [];
    }

    // Get shops from these communities
    const shops = await this.prisma.shop.findMany({
      where: {
        communityId: {
          in: communityIds,
        },
        isDeleted: false,
        isActive: true,
      },
      include: {
        products: {
          where: {
            isDeleted: false,
            isActive: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
          take: 4,
          select: {
            id: true,
            name: true,
            description: true,
            price: true,
            stock: true,
            mediaUrls: true,
            createdAt: true,
          },
        },
      },
    });

    // Sort shops by the order of followed communities
    const shopMap = new Map(shops.map((shop) => [shop.communityId, shop]));
    const sortedShops = communityIds
      .map((communityId) => shopMap.get(communityId))
      .filter((shop) => shop !== undefined);

    return sortedShops.map((shop) => ({
      id: shop.id,
      name: shop.name,
      description: shop.description,
      avatarUrl: shop.avatarUrl,
      communityId: shop.communityId,
      products: shop.products.map(
        (product): ShopProductDto => ({
          id: product.id,
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          mediaUrls: product.mediaUrls,
          createdAt: product.createdAt,
        }),
      ),
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    }));
  }

  async getShops(
    filters: GetShopsDto,
  ): Promise<PaginationResponse<UserShopDto>> {
    const { offset, limit, page, search } = filters;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
      isActive: true,
    };

    // Add search filter
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    const [shops, total] = await Promise.all([
      this.prisma.shop.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          avatarUrl: true,
          communityId: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.shop.count({
        where: whereClause,
      }),
    ]);

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(shops, pageInfo);
  }

  async getShopProducts(
    shopId: string,
    filters: GetShopProductsDto,
  ): Promise<PaginationResponse<UserProductDto>> {
    const { offset, limit, page, search } = filters;

    // Check if shop exists
    const shop = await this.prisma.shop.findUnique({
      where: {
        id: shopId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!shop) {
      throw new CustomError(ErrorCode.ValidationFailed, {
        message: 'Shop not found',
      });
    }

    // Build where clause
    const whereClause: Record<string, unknown> = {
      shopId,
      isDeleted: false,
      isActive: true,
    };

    // Add search filter
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          mediaUrls: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.product.count({
        where: whereClause,
      }),
    ]);

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(products, pageInfo);
  }

  async getProductById(id: string): Promise<UserProductDetailDto> {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        note: true,
        price: true,
        stock: true,
        mediaUrls: true,
        shop: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          where: {
            isDeleted: false,
            isActive: true,
          },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!product) {
      throw new CustomError(ErrorCode.ValidationFailed, {
        message: 'Product not found',
      });
    }

    return product;
  }

  async addToCart(
    userId: string,
    addToCartDto: AddToCartDto,
  ): Promise<CartDto> {
    const { productId, variantId, quantity, action } = addToCartDto;

    // Verify product exists
    const product = await this.prisma.product.findUnique({
      where: {
        id: productId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!product) {
      throw new CustomError(ErrorCode.ValidationFailed, {
        message: 'Product not found',
      });
    }

    // Verify variant exists if provided and get stock
    let availableStock = product.stock;
    if (variantId) {
      const variant = await this.prisma.productVariant.findUnique({
        where: {
          id: variantId,
          isDeleted: false,
          isActive: true,
        },
      });

      if (!variant || variant.productId !== productId) {
        throw new CustomError(ErrorCode.ValidationFailed, {
          message: 'Product variant not found',
        });
      }
      availableStock = variant.stock;
    }

    // Get or create cart for user
    let cart = await this.prisma.cart.findFirst({
      where: {
        userId,
        isDeleted: false,
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: {
          userId,
        },
      });
    }

    // Check if item already exists in cart
    const existingItem = await this.prisma.cartItem.findFirst({
      where: {
        cartId: cart.id,
        productId,
        variantId: variantId || null,
        isDeleted: false,
      },
    });

    // Calculate new quantity based on action
    let newQuantity: number;
    if (action === 'increase') {
      newQuantity = existingItem ? existingItem.quantity + quantity : quantity;

      // Check if new quantity exceeds available stock
      if (newQuantity > availableStock) {
        throw new CustomError(ErrorCode.ValidationFailed, {
          message: `Insufficient stock. Only ${availableStock} items available${existingItem ? `, you already have ${existingItem.quantity} in cart` : ''}.`,
        });
      }
    } else {
      // Decrease action
      if (!existingItem) {
        throw new CustomError(ErrorCode.ValidationFailed, {
          message: 'Item not found in cart',
        });
      }

      newQuantity = existingItem.quantity - quantity;

      if (newQuantity < 0) {
        throw new CustomError(ErrorCode.ValidationFailed, {
          message: `Cannot decrease quantity. Current quantity is ${existingItem.quantity}.`,
        });
      }
    }

    if (existingItem) {
      if (newQuantity === 0) {
        // Remove item from cart if quantity becomes 0
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            isDeleted: true,
          },
        });
      } else {
        // Update quantity
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: newQuantity,
          },
        });
      }
    } else {
      // Create new cart item (only for increase action)
      await this.prisma.cartItem.create({
        data: {
          cartId: cart.id,
          productId,
          variantId,
          quantity: newQuantity,
        },
      });
    }

    return this.getCart(userId);
  }

  async getCart(userId: string): Promise<CartDto> {
    // Get or create cart for user
    const cart = await this.prisma.cart.findFirst({
      where: {
        userId,
        isDeleted: false,
      },
      include: {
        items: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            quantity: true,
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
                mediaUrls: true,
              },
            },
            variant: {
              select: {
                id: true,
                name: true,
                price: true,
                stock: true,
              },
            },
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
    });

    if (!cart) {
      const newCart = await this.prisma.cart.create({
        data: {
          userId,
        },
      });

      return {
        id: newCart.id,
        items: [],
        createdAt: newCart.createdAt,
        updatedAt: newCart.updatedAt,
      };
    }

    // Map items and calculate isOutOfStock
    const items = cart.items.map((item) => {
      const availableStock = item.variant
        ? item.variant.stock
        : item.product.stock;
      const isOutOfStock = availableStock < item.quantity;

      return {
        ...item,
        isOutOfStock,
      };
    });

    return {
      id: cart.id,
      items,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  async removeFromCart(userId: string, cartItemId: string): Promise<CartDto> {
    // Verify cart item exists and belongs to user
    const cartItem = await this.prisma.cartItem.findFirst({
      where: {
        id: cartItemId,
        isDeleted: false,
        cart: {
          userId,
          isDeleted: false,
        },
      },
    });

    if (!cartItem) {
      throw new CustomError(ErrorCode.ValidationFailed, {
        message: 'Cart item not found',
      });
    }

    // Soft delete the cart item
    await this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: {
        isDeleted: true,
      },
    });

    return this.getCart(userId);
  }
}
