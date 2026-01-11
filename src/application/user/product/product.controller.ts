import { PaginationDto } from '@application/shared/dto/pagination.dto';
import { CurrentUser } from '@core/decorator/current-user.decorator';
import {
  ApiExtraModelsCustom,
  ApiPaginationResponse,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { JwtAuthGuard } from '@core/guard/jwt-auth.guard';
import { BaseResponse } from '@core/response/base-response';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  CreateProductDto,
  ProductResponseDto,
  ProductVariantDto,
  ProductVariantResponseDto,
  UpdateProductDto,
  UpdateStockDto,
  UpdateVariantDto,
} from './dto';
import { ProductApplicationService } from './product.service';

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
@ApiExtraModelsCustom(ProductResponseDto, ProductVariantResponseDto)
@Controller('user/product')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductController {
  constructor(private readonly productService: ProductApplicationService) {}

  /**
   * Create new product
   */
  @Post()
  @ApiOperation({ summary: 'Create new product' })
  @ApiResponseCustom(ProductResponseDto)
  async createProduct(
    @Req() req,
    @Body() dto: CreateProductDto,
  ): Promise<BaseResponse<ProductResponseDto>> {
    const result = await this.productService.createProduct(
      req.user.userId,
      dto,
    );
    return BaseResponse.of(result);
  }

  /**
   * Get product by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get product by ID' })
  @ApiResponseCustom(ProductResponseDto)
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
  @ApiResponseCustom(ProductResponseDto)
  async updateProduct(
    @CurrentUser('id') userId: string,
    @Param('id') productId: string,
    @Body() dto: UpdateProductDto,
  ): Promise<BaseResponse<ProductResponseDto>> {
    const result = await this.productService.updateProduct(
      userId,
      productId,
      dto,
    );
    return BaseResponse.of(result);
  }

  /**
   * Delete product (soft delete)
   */
  @Delete(':id')
  @ApiOperation({ summary: 'Delete product (soft delete)' })
  @ApiResponseCustom()
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
  @ApiResponseCustom(ProductResponseDto)
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
  @ApiResponseCustom(ProductResponseDto)
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
  @ApiResponseCustom(ProductResponseDto)
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
  @ApiResponseCustom(ProductResponseDto)
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
  @ApiResponseCustom(ProductResponseDto)
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
  @ApiPaginationResponse(ProductResponseDto)
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
  @ApiPaginationResponse(ProductResponseDto)
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
