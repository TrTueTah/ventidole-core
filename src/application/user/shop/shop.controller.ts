import {
  Controller,
  Post,
  Get,
  Patch,
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
import { ShopApplicationService } from './shop.service';
import {
  CreateShopDto,
  UpdateShopDto,
  ShopResponseDto,
} from './dto';

/**
 * Shop Controller
 *
 * HTTP endpoints for shop management.
 *
 * Pattern:
 * 1. Validate input (DTOs)
 * 2. Call application service
 * 3. Map to response DTO
 */
@ApiTags('Shop')
@Controller('user/shop')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ShopController {
  constructor(
    private readonly shopService: ShopApplicationService,
  ) {}

  /**
   * Create new shop
   */
  @Post()
  @ApiOperation({ summary: 'Create new shop' })
  async createShop(
    @CurrentUser('id') ownerId: string,
    @Body() dto: CreateShopDto,
  ): Promise<BaseResponse<ShopResponseDto>> {
    const result = await this.shopService.createShop(ownerId, dto);
    return BaseResponse.of(result);
  }

  /**
   * Get my shop
   */
  @Get('me')
  @ApiOperation({ summary: 'Get my shop' })
  async getMyShop(
    @CurrentUser('id') ownerId: string,
  ): Promise<BaseResponse<ShopResponseDto | null>> {
    const result = await this.shopService.getMyShop(ownerId);
    return BaseResponse.of(result);
  }

  /**
   * Get shop by ID
   */
  @Get(':id')
  @ApiOperation({ summary: 'Get shop by ID' })
  async getShop(
    @CurrentUser('id') userId: string,
    @Param('id') shopId: string,
  ): Promise<BaseResponse<ShopResponseDto>> {
    const result = await this.shopService.getShop(userId, shopId);
    return BaseResponse.of(result);
  }

  /**
   * Update shop
   */
  @Patch(':id')
  @ApiOperation({ summary: 'Update shop' })
  async updateShop(
    @CurrentUser('id') userId: string,
    @Param('id') shopId: string,
    @Body() dto: UpdateShopDto,
  ): Promise<BaseResponse<ShopResponseDto>> {
    const result = await this.shopService.updateShop(userId, shopId, dto);
    return BaseResponse.of(result);
  }

  /**
   * Activate shop
   */
  @Patch(':id/activate')
  @ApiOperation({ summary: 'Activate shop' })
  async activateShop(
    @CurrentUser('id') userId: string,
    @Param('id') shopId: string,
  ): Promise<BaseResponse<ShopResponseDto>> {
    const result = await this.shopService.activateShop(userId, shopId);
    return BaseResponse.of(result);
  }

  /**
   * Deactivate shop
   */
  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Deactivate shop' })
  async deactivateShop(
    @CurrentUser('id') userId: string,
    @Param('id') shopId: string,
  ): Promise<BaseResponse<ShopResponseDto>> {
    const result = await this.shopService.deactivateShop(userId, shopId);
    return BaseResponse.of(result);
  }

  /**
   * Get all shops
   */
  @Get()
  @ApiOperation({ summary: 'Get all shops' })
  async getAllShops(
    @Query() pagination: PaginationDto,
    @Query('isActive') isActive?: boolean,
  ): Promise<BaseResponse<any>> {
    const result = await this.shopService.getAllShops(
      pagination.page,
      pagination.limit,
      isActive,
    );
    return BaseResponse.of(result);
  }
}
