import {
  PageInfo,
  PaginationResponse,
} from '@application/shared/dto/pagination.dto';
import { CanManageShopPolicy, CanViewShopPolicy } from '@domain/commerce/shop';
import { ShopAggregate } from '@domain/commerce/shop/shop.aggregate';
import { ShopRepository } from '@domain/commerce/shop/shop.repository';
import { ShopId } from '@domain/shared/value-objects/shop-id.vo';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateShopDto, ShopResponseDto, UpdateShopDto } from './dto';

/**
 * Shop Application Service
 *
 * Orchestrates shop use cases.
 *
 * Responsibilities:
 * - Coordinate policies, repositories, and domain logic
 * - Map between DTOs and domain aggregates
 * - Handle application-level concerns
 *
 * Pattern:
 * 1. Check policy (if needed)
 * 2. Load aggregate
 * 3. Execute business logic
 * 4. Persist
 * 5. Return DTO
 */
@Injectable()
export class ShopApplicationService {
  constructor(
    @Inject('ShopRepository')
    private readonly shopRepository: ShopRepository,
    private readonly canViewShop: CanViewShopPolicy,
    private readonly canManageShop: CanManageShopPolicy,
  ) {}

  /**
   * Create new shop
   */
  async createShop(
    ownerId: string,
    dto: CreateShopDto,
  ): Promise<ShopResponseDto> {
    // Business rule: User can only have one shop
    const existingShop = await this.shopRepository.existsByOwner(
      UserId.fromString(ownerId),
    );

    if (existingShop) {
      throw new ConflictException('User already has a shop');
    }

    // Create aggregate
    const shop = ShopAggregate.create({
      ownerId,
      name: dto.name,
      description: dto.description,
      logoUrl: dto.logoUrl,
      bannerUrl: dto.bannerUrl,
    });

    // Persist
    await this.shopRepository.save(shop);

    // Return DTO
    return this.mapToDto(shop);
  }

  /**
   * Get shop by ID
   */
  async getShop(userId: string, shopId: string): Promise<ShopResponseDto> {
    // Check policy
    await this.canViewShop.check(userId, shopId);

    // Load aggregate
    const shop = await this.shopRepository.findById(ShopId.fromString(shopId));

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Return DTO
    return this.mapToDto(shop);
  }

  /**
   * Get my shop (current user's shop)
   */
  async getMyShop(ownerId: string): Promise<ShopResponseDto | null> {
    // Load aggregate
    const shop = await this.shopRepository.findByOwner(
      UserId.fromString(ownerId),
    );

    if (!shop) {
      return null;
    }

    // Return DTO
    return this.mapToDto(shop);
  }

  /**
   * Update shop
   */
  async updateShop(
    userId: string,
    shopId: string,
    dto: UpdateShopDto,
  ): Promise<ShopResponseDto> {
    // Check policy
    await this.canManageShop.check(userId, shopId);

    // Load aggregate
    const shop = await this.shopRepository.findById(ShopId.fromString(shopId));

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Execute business logic
    shop.update({
      name: dto.name,
      description: dto.description,
      logoUrl: dto.logoUrl,
      bannerUrl: dto.bannerUrl,
    });

    // Persist
    await this.shopRepository.save(shop);

    // Return DTO
    return this.mapToDto(shop);
  }

  /**
   * Activate shop
   */
  async activateShop(userId: string, shopId: string): Promise<ShopResponseDto> {
    // Check policy
    await this.canManageShop.check(userId, shopId);

    // Load aggregate
    const shop = await this.shopRepository.findById(ShopId.fromString(shopId));

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Execute business logic
    shop.activate();

    // Persist
    await this.shopRepository.save(shop);

    // Return DTO
    return this.mapToDto(shop);
  }

  /**
   * Deactivate shop
   */
  async deactivateShop(
    userId: string,
    shopId: string,
  ): Promise<ShopResponseDto> {
    // Check policy
    await this.canManageShop.check(userId, shopId);

    // Load aggregate
    const shop = await this.shopRepository.findById(ShopId.fromString(shopId));

    if (!shop) {
      throw new NotFoundException('Shop not found');
    }

    // Execute business logic
    shop.deactivate();

    // Persist
    await this.shopRepository.save(shop);

    // Return DTO
    return this.mapToDto(shop);
  }

  /**
   * Get all shops (for browsing)
   */
  async getAllShops(
    page: number,
    limit: number,
    isActive?: boolean,
  ): Promise<PaginationResponse<ShopResponseDto>> {
    const result = await this.shopRepository.findAll({
      page,
      limit,
      isActive,
    });

    const data = result.shops.map((s) => this.mapToDto(s));
    const paging = new PageInfo(page, limit, result.total);

    return new PaginationResponse(data, paging);
  }

  /**
   * Map aggregate to DTO
   */
  private mapToDto(shop: ShopAggregate): ShopResponseDto {
    return {
      id: shop.id.value,
      ownerId: shop.ownerId.value,
      name: shop.name.value,
      description: shop.description,
      logoUrl: shop.logoUrl,
      bannerUrl: shop.bannerUrl,
      isActive: shop.isActive,
      createdAt: shop.createdAt,
      updatedAt: shop.updatedAt,
    };
  }
}
