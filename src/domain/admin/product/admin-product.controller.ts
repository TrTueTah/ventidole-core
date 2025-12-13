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
import { AdminProductService } from './admin-product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { ProductDetailDto } from './dto/product-detail.dto';
import { ProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@ApiBearerAuth()
@ApiTags('Admin Product Management')
@Controller({ path: 'admin/product', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  ProductDto,
  ProductDetailDto,
  CreateProductDto,
  UpdateProductDto,
)
export class AdminProductController {
  constructor(private readonly adminProductService: AdminProductService) {}

  @Get()
  @ApiPaginationResponse(ProductDto)
  async getAllProducts(
    @Query() filters: GetProductsDto,
  ): Promise<PaginationResponse<ProductDto>> {
    const result = await this.adminProductService.getAllProducts(filters);
    return result;
  }

  @Get(':id')
  @ApiResponseCustom(ProductDetailDto)
  async getProductById(
    @Param('id') id: string,
  ): Promise<BaseResponse<ProductDetailDto>> {
    const result = await this.adminProductService.getProductById(id);
    return BaseResponse.of(result);
  }

  @Post()
  @ApiResponseCustom(ProductDto)
  async createProduct(
    @Body() createProductDto: CreateProductDto,
  ): Promise<BaseResponse<ProductDto>> {
    const result =
      await this.adminProductService.createProduct(createProductDto);
    return BaseResponse.of(result);
  }

  @Patch(':id')
  @ApiResponseCustom(ProductDto)
  async updateProduct(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ): Promise<BaseResponse<ProductDto>> {
    const result = await this.adminProductService.updateProduct(
      id,
      updateProductDto,
    );
    return BaseResponse.of(result);
  }

  @Delete(':id')
  @ApiResponseCustom()
  async deleteProduct(@Param('id') id: string): Promise<BaseResponse<null>> {
    await this.adminProductService.deleteProduct(id);
    return BaseResponse.ok();
  }
}
