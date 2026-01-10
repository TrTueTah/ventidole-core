import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@core/guard/jwt-auth.guard';
import { CurrentUser } from '@core/decorator/current-user.decorator';
import { BaseResponse } from '@application/shared/dto/base-response.dto';
import { PaginationDto } from '@application/shared/dto/pagination.dto';
import { ProductApplicationService } from './product.service';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateVariantDto,
  UpdateStockDto,
  ProductResponseDto,
  ProductVariantDto,
} from './dto';

/**
 * Product Controller
 *
 * HTTP endpoints for product management.
 *
 * Pattern:
 * 1. Validate input (DTOs)
 * 2. Call application service
 * 3. Map to response DTO
 */
@ApiTags('Product')
@Controller('user/product')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductController {
  constructor(
    private readonly productService: ProductApplicationService,
  ) {}

  /**
   * Create new product
   */
  @Post()
  @ApiOperation({ summary: 'Create new product' })
  async createProduct(
    @Body() dto: CreateProductDto,
  ): Promise<BaseResponse<ProductResponseDto>> {
    const result = await this.productService.createProduct(dto);
    return BaseResponse.of(result);
  }

  /**
   * Get product by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  async getProduct(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
  ): Promise<BaseResponse<ProductResponseDto>> {
    const result = await this.productService.getProduct(userId, productId);
    return BaseResponse.of(result);
  }

  /**
   * Update product
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update product' })
  async updateProduct(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
  ): Promise<BaseResponse<ProductResponseDto>> {
    const result = await this.productService.updateProduct(userId, productId, dto);
    return BaseResponse.of(result);
  }

  /**
   * Delete product (soft delete)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product (soft delete)' })
  async deleteProduct(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
  ): Promise<BaseResponse<void>> {
    await this.productService.deleteProduct(userId, productId);
    return BaseResponse.of(undefined);
  }

  /**
   * Add variant to product
   */
  @Post(':id/variant')
  @ApiOperation({ summary: 'Add variant to product' })
  async addVariant(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Body() dto: ProductVariantDto,
  ): Promise<BaseResponse<ProductResponseDto>> {
    const result = await this.productService.addVariant(userId, productId, dto);
    return BaseResponse.of(result);
  }

  /**
   * Update variant
   */
  @Patch(':id/variant/:variantId')
  @ApiOperation({ summary: 'Update variant' })
  async updateVariant(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateVariantDto,
  ): Promise<BaseResponse<ProductResponseDto>> {
    const result = await this.productService.updateVariant(
      userId,
      productId,
      variantId,
      dto,
    );
    return BaseResponse.of(result);
  }

  /**
   * Update variant stock
   */
  @Patch(':id/variant/:variantId/stock')
  @ApiOperation({ summary: 'Update variant stock' })
  async updateVariantStock(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
    @Body() dto: UpdateStockDto,
  ): Promise<BaseResponse<ProductResponseDto>> {
    const result = await this.productService.updateVariantStock(
      userId,
      productId,
      variantId,
      dto,
    );
    return BaseResponse.of(result);
  }

  /**
   * Activate variant
   */
  @Patch(':id/variant/:variantId/activate')
  @ApiOperation({ summary: 'Activate variant' })
  async activateVariant(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
  ): Promise<BaseResponse<ProductResponseDto>> {
    const result = await this.productService.activateVariant(
      userId,
      productId,
      variantId,
    );
    return BaseResponse.of(result);
  }

  /**
   * Deactivate variant
   */
  @Patch(':id/variant/:variantId/deactivate')
  @ApiOperation({ summary: 'Deactivate variant' })
  async deactivateVariant(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Param('variantId') variantId: string,
  ): Promise<BaseResponse<ProductResponseDto>> {
    const result = await this.productService.deactivateVariant(
      userId,
      productId,
      variantId,
    );
    return BaseResponse.of(result);
  }

  /**
   * Get products by shop
   */
  @Get('shop/:shopId')
  @ApiOperation({ summary: 'Get products by shop' })
  async getProductsByShop(
    @Param('shopId') shopId: string,
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
    @Query('isActive') isActive?: boolean,
  ): Promise<BaseResponse<any>> {
    const result = await this.productService.getProductsByShop(
      shopId,
      pagination.page,
      pagination.limit,
      category,
      isActive,
    );
    return BaseResponse.of(result);
  }

  /**
   * Search products
   */
  @Get('search')
  @ApiOperation({ summary: 'Search products by name' })
  async searchProducts(
    @Query('q') query: string,
    @Query() pagination: PaginationDto,
    @Query('category') category?: string,
  ): Promise<BaseResponse<any>> {
    const result = await this.productService.searchProducts(
      query,
      pagination.page,
      pagination.limit,
      category,
    );
    return BaseResponse.of(result);
  }
}
