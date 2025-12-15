import {
  ApiExtraModelsCustom,
  ApiPaginationResponse,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { AddToCartDto } from './dto/add-to-cart.dto';
import {
  CartDto,
  CartItemDto,
  CartItemProductDto,
  CartItemVariantDto,
} from './dto/cart.dto';
import { GetShopProductsDto } from './dto/get-shop-products.dto';
import { GetShopsDto } from './dto/get-shops.dto';
import {
  UserProductDetailDto,
  UserProductDetailShopDto,
  UserProductDetailTypeDto,
  UserProductVariantDto,
} from './dto/product-detail.dto';
import { UserProductDto } from './dto/product.dto';
import { ShopListDto } from './dto/shop-list.dto';
import { ShopProductDto } from './dto/shop-product.dto';
import { UserShopDto } from './dto/shop.dto';
import { ShopService } from './shop.service';

@ApiBearerAuth()
@ApiTags('User Shop')
@Controller({ path: 'user/shop', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  ShopListDto,
  ShopProductDto,
  UserProductDto,
  UserShopDto,
  UserProductDetailDto,
  UserProductVariantDto,
  UserProductDetailShopDto,
  UserProductDetailTypeDto,
  CartDto,
  CartItemDto,
  CartItemProductDto,
  CartItemVariantDto,
  AddToCartDto,
)
export class ShopController {
  constructor(private readonly shopService: ShopService) {}

  @Get('following')
  @ApiResponseCustom(ShopListDto, true)
  async getFollowingCommunityShops(
    @Req() req: IRequest,
  ): Promise<BaseResponse<ShopListDto[]>> {
    const result = await this.shopService.getFollowingCommunityShops(
      req.user.id,
    );
    return BaseResponse.of(result);
  }

  @Get()
  @ApiPaginationResponse(UserShopDto)
  async getShops(
    @Query() filters: GetShopsDto,
  ): Promise<PaginationResponse<UserShopDto>> {
    const result = await this.shopService.getShops(filters);
    return result;
  }

  @Get(':shopId/products')
  @ApiPaginationResponse(UserProductDto)
  async getShopProducts(
    @Param('shopId') shopId: string,
    @Query() filters: GetShopProductsDto,
  ): Promise<PaginationResponse<UserProductDto>> {
    const result = await this.shopService.getShopProducts(shopId, filters);
    return result;
  }

  @Get('products/:id')
  @ApiResponseCustom(UserProductDetailDto)
  async getProductById(
    @Param('id') id: string,
  ): Promise<BaseResponse<UserProductDetailDto>> {
    const result = await this.shopService.getProductById(id);
    return BaseResponse.of(result);
  }

  @Post('cart')
  @ApiResponseCustom(CartDto)
  async addToCart(
    @Req() req: IRequest,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<BaseResponse<CartDto>> {
    const result = await this.shopService.addToCart(req.user.id, addToCartDto);
    return BaseResponse.of(result);
  }

  @Get('cart')
  @ApiResponseCustom(CartDto)
  async getCart(@Req() req: IRequest): Promise<BaseResponse<CartDto>> {
    const result = await this.shopService.getCart(req.user.id);
    return BaseResponse.of(result);
  }

  @Delete('cart/:cartItemId')
  @ApiResponseCustom(CartDto)
  async removeFromCart(
    @Req() req: IRequest,
    @Param('cartItemId') cartItemId: string,
  ): Promise<BaseResponse<CartDto>> {
    const result = await this.shopService.removeFromCart(
      req.user.id,
      cartItemId,
    );
    return BaseResponse.of(result);
  }
}
