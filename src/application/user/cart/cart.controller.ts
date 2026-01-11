import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Request,
  HttpCode,
  HttpStatus,
  Version,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { CartApplicationService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto, CartResponseDto } from './dto';

/**
 * Cart Controller
 *
 * REST API for shopping cart management.
 *
 * Routes:
 * - POST /v1/user/cart/items - Add item to cart
 * - GET /v1/user/cart - Get user's cart
 * - PATCH /v1/user/cart/items/:itemId - Update item quantity
 * - DELETE /v1/user/cart/items/:itemId - Remove item
 * - DELETE /v1/user/cart - Clear cart
 */
@ApiTags('Cart')
@ApiBearerAuth()
@Controller({ path: 'user/cart', version: '1' })
export class CartController {
  constructor(private readonly cartService: CartApplicationService) {}

  /**
   * Add item to cart
   */
  @Post('items')
  @ApiOperation({ summary: 'Add item to cart' })
  @ApiResponse({ status: 200, description: 'Item added successfully', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Product not found' })
  async addItem(
    @Request() req,
    @Body() dto: AddToCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItem(req.user.userId, dto);
  }

  /**
   * Get user's cart
   */
  @Get()
  @ApiOperation({ summary: 'Get user cart' })
  @ApiResponse({ status: 200, description: 'Cart retrieved successfully', type: CartResponseDto })
  async getCart(@Request() req): Promise<CartResponseDto> {
    return this.cartService.getCart(req.user.userId);
  }

  /**
   * Update cart item quantity
   */
  @Patch('items/:itemId')
  @ApiOperation({ summary: 'Update cart item quantity' })
  @ApiResponse({ status: 200, description: 'Item updated successfully', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  async updateItemQuantity(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateItemQuantity(req.user.userId, itemId, dto);
  }

  /**
   * Remove item from cart
   */
  @Delete('items/:itemId')
  @ApiOperation({ summary: 'Remove item from cart' })
  @ApiResponse({ status: 200, description: 'Item removed successfully', type: CartResponseDto })
  @ApiResponse({ status: 404, description: 'Cart or item not found' })
  async removeItem(
    @Request() req,
    @Param('itemId') itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeItem(req.user.userId, itemId);
  }

  /**
   * Clear entire cart
   */
  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear entire cart' })
  @ApiResponse({ status: 200, description: 'Cart cleared successfully' })
  async clearCart(@Request() req): Promise<{ success: boolean }> {
    return this.cartService.clearCart(req.user.userId);
  }
}
