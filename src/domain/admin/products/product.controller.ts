import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody } from '@nestjs/swagger';
import { ProductService } from './product.service';
import { Roles } from '@core/decorator/role.decorator';
import { Role } from 'src/db/prisma/enums';
import { CreateProductRequest, GetProductsRequest } from './request/index.request';
import { CreateProductResponse, ProductDto } from './response/index.response';
import { BaseResponse } from '@shared/helper/response';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { ApiPaginationResponse } from '@core/decorator/doc.decorator';

@ApiBearerAuth()
@Roles(Role.ADMIN)
@ApiTags('Admin Products')
@Controller({ path: 'admin/products', version: ApiVersion.V1 })
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new product (Admin only)' })
  @ApiBody({ type: CreateProductRequest })
  @ApiResponse({ status: 201, type: CreateProductResponse })
  async createProduct(
    @Body() body: CreateProductRequest,
  ): Promise<BaseResponse<CreateProductResponse>> {
    return this.productService.createProduct(body);
  }

  @Get()
  @ApiOperation({ summary: 'Get all products with pagination (Admin only)' })
  @ApiPaginationResponse(ProductDto)
  async getAllProducts(@Query() query: GetProductsRequest) {
    return this.productService.getProducts(query);
  }
}