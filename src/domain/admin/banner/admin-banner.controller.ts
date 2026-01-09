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
import { AdminBannerService } from './admin-banner.service';
import { BannerDetailDto } from './dto/banner-detail.dto';
import { BannerDto } from './dto/banner.dto';
import { CreateBannerDto } from './dto/create-banner.dto';
import { GetBannersDto } from './dto/get-banners.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

@ApiBearerAuth()
@ApiTags('Admin Banner Management')
@Controller({ path: 'admin/banner', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  BannerDto,
  BannerDetailDto,
  CreateBannerDto,
  UpdateBannerDto,
)
export class AdminBannerController {
  constructor(private readonly adminBannerService: AdminBannerService) {}

  @Get()
  @ApiPaginationResponse(BannerDto)
  async getAllBanners(
    @Query() filters: GetBannersDto,
  ): Promise<PaginationResponse<BannerDto>> {
    const result = await this.adminBannerService.getAllBanners(filters);
    return result;
  }

  @Get(':id')
  @ApiResponseCustom(BannerDetailDto)
  async getBannerById(
    @Param('id') id: string,
  ): Promise<BaseResponse<BannerDetailDto>> {
    const result = await this.adminBannerService.getBannerById(id);
    return BaseResponse.of(result);
  }

  @Post()
  @ApiResponseCustom(BannerDetailDto)
  async createBanner(
    @Body() createBannerDto: CreateBannerDto,
  ): Promise<BaseResponse<BannerDetailDto>> {
    const result = await this.adminBannerService.createBanner(createBannerDto);
    return BaseResponse.of(result);
  }

  @Patch(':id')
  @ApiResponseCustom(BannerDetailDto)
  async updateBanner(
    @Param('id') id: string,
    @Body() updateBannerDto: UpdateBannerDto,
  ): Promise<BaseResponse<BannerDetailDto>> {
    const result = await this.adminBannerService.updateBanner(
      id,
      updateBannerDto,
    );
    return BaseResponse.of(result);
  }

  @Delete(':id')
  @ApiResponseCustom(null)
  async deleteBanner(@Param('id') id: string): Promise<BaseResponse<null>> {
    await this.adminBannerService.deleteBanner(id);
    return BaseResponse.of(null);
  }
}
