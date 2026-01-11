import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@application/shared/dto/pagination.dto';
import { ProductRepository } from '@domain/commerce/product/product.repository';
import { ProductAggregate } from '@domain/commerce/product/product.aggregate';
import { ProductId } from '@domain/shared/value-objects/product-id.vo';
import { ShopId } from '@domain/shared/value-objects/shop-id.vo';
import {
  CanViewProductPolicy,
  CanManageProductPolicy,
} from '@domain/commerce/product';
import { CanManageShopPolicy } from '@domain/commerce/shop/policies/can-manage-shop.policy';
import {
  CreateProductDto,
  UpdateProductDto,
  UpdateVariantDto,
  UpdateStockDto,
  ProductResponseDto,
  ProductVariantResponseDto,
  ProductVariantDto,
} from './dto';

/**
 * Product Application Service
 *
 * Orchestrates product use cases.
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
export class ProductApplicationService {
  constructor(
    @Inject('ProductRepository')
    private readonly productRepository: ProductRepository,
    private readonly canViewProduct: CanViewProductPolicy,
    private readonly canManageProduct: CanManageProductPolicy,
    private readonly canManageShop: CanManageShopPolicy,
  ) {}

  /**
   * Create new product
   */
  async createProduct(userId: string, dto: CreateProductDto): Promise<ProductResponseDto> {
    // Check if user can manage shop
    await this.canManageShop.check(userId, dto.shopId);

    // Create aggregate
    const product = ProductAggregate.create({
      shopId: dto.shopId,
      name: dto.name,
      description: dto.description,
      basePrice: dto.basePrice,
      imageUrls: dto.imageUrls,
      category: dto.category,
      variants: dto.variants,
    });

    // Persist
    await this.productRepository.save(product);

    // Return DTO
    return this.mapToDto(product);
  }

  /**
   * Get product by ID
   */
  async getProduct(userId: string, productId: string): Promise<ProductResponseDto> {
    // Check policy
    await this.canViewProduct.check(userId, productId);

    // Load aggregate
    const product = await this.productRepository.findById(
      ProductId.fromString(productId),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Return DTO
    return this.mapToDto(product);
  }

  /**
   * Update product
   */
  async updateProduct(
    userId: string,
    productId: string,
    dto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    // Check policy
    await this.canManageProduct.check(userId, productId);

    // Load aggregate
    const product = await this.productRepository.findById(
      ProductId.fromString(productId),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Execute business logic
    product.update({
      name: dto.name,
      description: dto.description,
      basePrice: dto.basePrice,
      imageUrls: dto.imageUrls,
      category: dto.category,
    });

    // Persist
    await this.productRepository.save(product);

    // Return DTO
    return this.mapToDto(product);
  }

  /**
   * Delete product (soft delete)
   */
  async deleteProduct(userId: string, productId: string): Promise<void> {
    // Check policy
    await this.canManageProduct.check(userId, productId);

    // Load aggregate
    const product = await this.productRepository.findById(
      ProductId.fromString(productId),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Execute business logic
    product.delete();

    // Persist
    await this.productRepository.save(product);
  }

  /**
   * Add variant to product
   */
  async addVariant(
    userId: string,
    productId: string,
    dto: ProductVariantDto,
  ): Promise<ProductResponseDto> {
    // Check policy
    await this.canManageProduct.check(userId, productId);

    // Load aggregate
    const product = await this.productRepository.findById(
      ProductId.fromString(productId),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Execute business logic
    product.addVariant({
      name: dto.name,
      price: dto.price,
      stock: dto.stock,
    });

    // Persist
    await this.productRepository.save(product);

    // Return DTO
    return this.mapToDto(product);
  }

  /**
   * Update variant
   */
  async updateVariant(
    userId: string,
    productId: string,
    variantId: string,
    dto: UpdateVariantDto,
  ): Promise<ProductResponseDto> {
    // Check policy
    await this.canManageProduct.check(userId, productId);

    // Load aggregate
    const product = await this.productRepository.findById(
      ProductId.fromString(productId),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Execute business logic
    product.updateVariant(variantId, {
      name: dto.name,
      price: dto.price,
    });

    // Persist
    await this.productRepository.save(product);

    // Return DTO
    return this.mapToDto(product);
  }

  /**
   * Update variant stock
   */
  async updateVariantStock(
    userId: string,
    productId: string,
    variantId: string,
    dto: UpdateStockDto,
  ): Promise<ProductResponseDto> {
    // Check policy
    await this.canManageProduct.check(userId, productId);

    // Load aggregate
    const product = await this.productRepository.findById(
      ProductId.fromString(productId),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Execute business logic
    product.updateVariantStock(variantId, dto.stock);

    // Persist
    await this.productRepository.save(product);

    // Return DTO
    return this.mapToDto(product);
  }

  /**
   * Activate variant
   */
  async activateVariant(
    userId: string,
    productId: string,
    variantId: string,
  ): Promise<ProductResponseDto> {
    // Check policy
    await this.canManageProduct.check(userId, productId);

    // Load aggregate
    const product = await this.productRepository.findById(
      ProductId.fromString(productId),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Execute business logic
    product.activateVariant(variantId);

    // Persist
    await this.productRepository.save(product);

    // Return DTO
    return this.mapToDto(product);
  }

  /**
   * Deactivate variant
   */
  async deactivateVariant(
    userId: string,
    productId: string,
    variantId: string,
  ): Promise<ProductResponseDto> {
    // Check policy
    await this.canManageProduct.check(userId, productId);

    // Load aggregate
    const product = await this.productRepository.findById(
      ProductId.fromString(productId),
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // Execute business logic
    product.deactivateVariant(variantId);

    // Persist
    await this.productRepository.save(product);

    // Return DTO
    return this.mapToDto(product);
  }

  /**
   * Get products by shop
   */
  async getProductsByShop(
    shopId: string,
    page: number,
    limit: number,
    category?: string,
    isActive?: boolean,
  ): Promise<PaginationResponse<ProductResponseDto>> {
    const result = await this.productRepository.findByShop(
      ShopId.fromString(shopId),
      { page, limit, category, isActive },
    );

    const data = result.products.map((p) => this.mapToDto(p));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Search products by name
   */
  async searchProducts(
    query: string,
    page: number,
    limit: number,
    category?: string,
  ): Promise<PaginationResponse<ProductResponseDto>> {
    const result = await this.productRepository.searchByName(query, {
      page,
      limit,
      category,
      isActive: true, // Only search active products
    });

    const data = result.products.map((p) => this.mapToDto(p));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Map aggregate to DTO
   */
  private mapToDto(product: ProductAggregate): ProductResponseDto {
    const variants: ProductVariantResponseDto[] = product.getVariants().map((v) => ({
      id: v.id,
      name: v.name,
      price: v.price.amount,
      stock: v.stock.quantity,
      isActive: v.isActive,
      createdAt: v.createdAt,
      updatedAt: v.updatedAt,
    }));

    return {
      id: product.id.value,
      shopId: product.shopId.value,
      name: product.name.value,
      description: product.description,
      basePrice: product.basePrice.amount,
      imageUrls: product.imageUrls,
      category: product.category,
      variants,
      isActive: product.isActive,
      isDeleted: product.isDeleted,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };
  }
}
