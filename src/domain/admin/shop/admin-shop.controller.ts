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
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { AdminShopService } from './admin-shop.service';
import { CreateShopDto } from './dto/create-shop.dto';
import { GetShopsDto } from './dto/get-shops.dto';
import { ShopDetailDto } from './dto/shop-detail.dto';
import { ShopDto } from './dto/shop.dto';
import { UpdateShopDto } from './dto/update-shop.dto';

@ApiBearerAuth()
@ApiTags('Admin Shop Management')
@Controller({ path: 'admin/shop', version: ApiVersion.V1 })
@ApiExtraModelsCustom(ShopDto, ShopDetailDto, CreateShopDto, UpdateShopDto)
export class AdminShopController {
  constructor(private readonly adminShopService: AdminShopService) {}

  @Get()
  @ApiPaginationResponse(ShopDto)
  async getAllShops(
    @Query() filters: GetShopsDto,
  ): Promise<PaginationResponse<ShopDto>> {
    const result = await this.adminShopService.getAllShops(filters);
    return result;
  }

  @Get(':id')
  @ApiResponseCustom(ShopDetailDto)
  async getShopById(
    @Param('id') id: string,
  ): Promise<BaseResponse<ShopDetailDto>> {
    const result = await this.adminShopService.getShopById(id);
    return BaseResponse.of(result);
  }

  @Post()
  @ApiResponseCustom(ShopDto)
  async createShop(
    @Body() createShopDto: CreateShopDto,
  ): Promise<BaseResponse<ShopDto>> {
    const result = await this.adminShopService.createShop(createShopDto);
    return BaseResponse.of(result);
  }

  @Patch(':id')
  @ApiResponseCustom(ShopDto)
  async updateShop(
    @Param('id') id: string,
    @Body() updateShopDto: UpdateShopDto,
  ): Promise<BaseResponse<ShopDto>> {
    const result = await this.adminShopService.updateShop(id, updateShopDto);
    return BaseResponse.of(result);
  }

  @Delete(':id')
  @ApiResponseCustom()
  async deleteShop(@Param('id') id: string): Promise<BaseResponse<null>> {
    await this.adminShopService.deleteShop(id);
    return BaseResponse.ok();
  }
}
