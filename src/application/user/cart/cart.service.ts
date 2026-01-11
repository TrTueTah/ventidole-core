import { Injectable, Inject, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { CartRepository } from '@domain/commerce/cart/cart.repository';
import { CartAggregate } from '@domain/commerce/cart/cart.aggregate';
import { CartId } from '@domain/shared/value-objects/cart-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CanManageCartPolicy } from '@domain/commerce/cart/policies/can-manage-cart.policy';
import { PrismaService } from '@infra/prisma/prisma.service';
import {
  AddToCartDto,
  UpdateCartItemDto,
  CartResponseDto,
  CartItemResponseDto,
} from './dto';

/**
 * Cart Application Service
 *
 * Orchestrates cart use cases.
 *
 * Responsibilities:
 * - Coordinate policies, repositories, and domain logic
 * - Map between DTOs and domain aggregates
 * - Handle application-level concerns
 *
 * Pattern:
 * 1. Check policy (if needed)
 * 2. Load aggregate (or create)
 * 3. Execute business logic
 * 4. Persist
 * 5. Return DTO
 */
@Injectable()
export class CartApplicationService {
  private readonly logger = new Logger(CartApplicationService.name);

  constructor(
    @Inject('CartRepository')
    private readonly cartRepository: CartRepository,
    private readonly canManageCart: CanManageCartPolicy,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Add item to cart
   * Creates cart automatically if user doesn't have one
   */
  async addItem(userId: string, dto: AddToCartDto): Promise<CartResponseDto> {
    // Get or create cart
    let cart = await this.cartRepository.findByUser(UserId.fromString(userId));

    if (!cart) {
      cart = CartAggregate.create(userId);
      this.logger.log(`Created new cart for user: ${userId}`);
    }

    // Get product details
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
      select: {
        id: true,
        name: true,
        price: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Validate product stock
    await this.validateProductStock(
      dto.productId,
      dto.variantId || null,
      dto.quantity,
    );

    // Add item to cart
    cart.addItem(
      dto.productId,
      product.name,
      dto.variantId || null,
      dto.quantity,
      product.price,
    );

    // Persist
    await this.cartRepository.save(cart);

    this.logger.log(
      `Added item to cart: userId=${userId}, productId=${dto.productId}, quantity=${dto.quantity}`,
    );

    // Return DTO
    return this.mapToDto(cart);
  }

  /**
   * Get user's cart
   */
  async getCart(userId: string): Promise<CartResponseDto> {
    const cart = await this.cartRepository.findByUser(UserId.fromString(userId));

    if (!cart) {
      // Return empty cart response
      return {
        id: null,
        userId,
        status: 'ACTIVE',
        items: [],
        itemCount: 0,
        totalQuantity: 0,
        totalAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any;
    }

    return this.mapToDto(cart);
  }

  /**
   * Update cart item quantity
   */
  async updateItemQuantity(
    userId: string,
    itemId: string,
    dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    // Load cart
    const cart = await this.cartRepository.findByUser(UserId.fromString(userId));

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Update item quantity
    cart.updateItemQuantity(itemId, dto.quantity);

    // Persist
    await this.cartRepository.save(cart);

    this.logger.log(
      `Updated cart item quantity: userId=${userId}, itemId=${itemId}, quantity=${dto.quantity}`,
    );

    // Return DTO
    return this.mapToDto(cart);
  }

  /**
   * Remove item from cart
   */
  async removeItem(userId: string, itemId: string): Promise<CartResponseDto> {
    // Load cart
    const cart = await this.cartRepository.findByUser(UserId.fromString(userId));

    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Remove item
    cart.removeItem(itemId);

    // Persist
    await this.cartRepository.save(cart);

    this.logger.log(`Removed item from cart: userId=${userId}, itemId=${itemId}`);

    // Return DTO
    return this.mapToDto(cart);
  }

  /**
   * Clear entire cart
   */
  async clearCart(userId: string): Promise<{ success: boolean }> {
    // Load cart
    const cart = await this.cartRepository.findByUser(UserId.fromString(userId));

    if (!cart) {
      return { success: true }; // Already empty
    }

    // Clear cart
    cart.clear('MANUAL');

    // Persist
    await this.cartRepository.save(cart);

    this.logger.log(`Cleared cart: userId=${userId}`);

    return { success: true };
  }

  /**
   * Clear cart for user (internal use by Order service)
   * Reason: PAYMENT_SUCCESS
   */
  async clearCartAfterPayment(userId: string): Promise<void> {
    const cart = await this.cartRepository.findByUser(UserId.fromString(userId));

    if (!cart) {
      return; // No cart to clear
    }

    cart.clear('PAYMENT_SUCCESS');
    await this.cartRepository.save(cart);

    this.logger.log(`Cleared cart after payment: userId=${userId}`);
  }

  /**
   * Validate product stock availability (internal helper)
   */
  private async validateProductStock(
    productId: string,
    variantId: string | null,
    quantity: number,
  ): Promise<void> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: {
        id: true,
        name: true,
        stock: true,
        isActive: true,
        isDeleted: true,
        variants: variantId
          ? {
              where: { id: variantId },
              select: {
                id: true,
                stock: true,
              },
            }
          : undefined,
      },
    });

    if (!product || !product.isActive || product.isDeleted) {
      throw new NotFoundException('Product not found or inactive');
    }

    if (variantId) {
      const variant = product.variants?.[0];
      if (!variant) {
        throw new NotFoundException('Variant not found');
      }

      if (variant.stock < quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${variant.stock}, Requested: ${quantity}`,
        );
      }
    } else {
      if (product.stock < quantity) {
        throw new BadRequestException(
          `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${quantity}`,
        );
      }
    }
  }

  /**
   * Map aggregate to DTO
   */
  private mapToDto(cart: CartAggregate): CartResponseDto {
    const items: CartItemResponseDto[] = cart.getItems().map((item) => ({
      id: item.id.value,
      productId: item.productId.value,
      productName: item.productName,
      variantId: item.variantId,
      quantity: item.quantity.value,
      unitPrice: item.unitPrice.amount,
      total: item.calculateTotal().amount,
    }));

    return {
      id: cart.id.value,
      userId: cart.userId.value,
      status: cart.status.value,
      items,
      itemCount: cart.getItemCount(),
      totalQuantity: cart.getTotalQuantity(),
      totalAmount: cart.calculateTotal().amount,
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }
}
