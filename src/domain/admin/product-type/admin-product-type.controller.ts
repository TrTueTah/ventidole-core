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
import { AdminProductTypeService } from './admin-product-type.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { GetProductTypesDto } from './dto/get-product-types.dto';
import {
  AdminProductTypeDetailDto,
  AdminProductTypeDto,
} from './dto/product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@ApiBearerAuth()
@ApiTags('Admin Product Type Management')
@Controller({ path: 'admin/product-type', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  AdminProductTypeDto,
  AdminProductTypeDetailDto,
  CreateProductTypeDto,
  UpdateProductTypeDto,
)
export class AdminProductTypeController {
  constructor(
    private readonly adminProductTypeService: AdminProductTypeService,
  ) {}

  @Get()
  @ApiPaginationResponse(AdminProductTypeDto)
  async getAllProductTypes(
    @Query() filters: GetProductTypesDto,
  ): Promise<PaginationResponse<AdminProductTypeDto>> {
    const result =
      await this.adminProductTypeService.getAllProductTypes(filters);
    return result;
  }

  @Get(':id')
  @ApiResponseCustom(AdminProductTypeDetailDto)
  async getProductTypeById(
    @Param('id') id: string,
  ): Promise<BaseResponse<AdminProductTypeDetailDto>> {
    const result = await this.adminProductTypeService.getProductTypeById(id);
    return BaseResponse.of(result);
  }

  @Post()
  @ApiResponseCustom(AdminProductTypeDto)
  async createProductType(
    @Body() createDto: CreateProductTypeDto,
  ): Promise<BaseResponse<AdminProductTypeDto>> {
    const result =
      await this.adminProductTypeService.createProductType(createDto);
    return BaseResponse.of(result);
  }

  @Patch(':id')
  @ApiResponseCustom(AdminProductTypeDto)
  async updateProductType(
    @Param('id') id: string,
    @Body() updateDto: UpdateProductTypeDto,
  ): Promise<BaseResponse<AdminProductTypeDto>> {
    const result = await this.adminProductTypeService.updateProductType(
      id,
      updateDto,
    );
    return BaseResponse.of(result);
  }

  @Delete(':id')
  @ApiResponseCustom()
  async deleteProductType(
    @Param('id') id: string,
  ): Promise<BaseResponse<null>> {
    await this.adminProductTypeService.deleteProductType(id);
    return BaseResponse.ok();
  }
}
