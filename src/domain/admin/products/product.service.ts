import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { BaseResponse } from '@shared/helper/response';
import { CreateProductRequest, GetProductsRequest } from './request/index.request';
import { PageInfo, PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ProductDto } from './response/get-product.response';
import { CreateProductResponse } from './response/create-product.response';

@Injectable()
export class ProductService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new product
   */
  async createProduct(body: CreateProductRequest): Promise<BaseResponse<CreateProductResponse>> {
    try {
      // Check if category exists
      const categoryExists = await this.prisma.productCategory.findUnique({
        where: {
          id: body.product_category_id,
          isActive: true,
        },
      });

      if (!categoryExists) {
        throw new CustomError(
          ErrorCode.ConsumerNotFound,
          'Product category not found',
          404,
        );
      }

      // Validate that at least one variant is provided
      if (!body.variants || body.variants.length === 0) {
        throw new CustomError(
          ErrorCode.ValidationFailed,
          'At least one product variant is required',
          400,
        );
      }

      // Create the product with variants in a transaction
      const product = await this.prisma.$transaction(async (prisma) => {
        // Create the product first
        const createdProduct = await prisma.product.create({
          data: {
            name: body.name,
            description: body.description,
            cover_image: body.cover_image,
            product_category_id: body.product_category_id,
          },
        });

        // Create variants for the product
        const variantData = body.variants.map(variant => ({
          name: variant.name,
          price_money: variant.price_money,
          total_supply: variant.total_supply,
          remaining_supply: variant.remaining_supply ?? variant.total_supply,
          product_id: createdProduct.id,
        }));

        await prisma.productVariant.createMany({
          data: variantData,
        });

        // Return the product with its category and variants
        return await prisma.product.findUnique({
          where: { id: createdProduct.id },
          include: {
            category: true,
            variants: true,
          },
        });
      });

      const response = new CreateProductResponse(product);
      return BaseResponse.of(response);
    } catch (error) {
      if (error instanceof CustomError) {
        throw error;
      }
      throw new CustomError(
        ErrorCode.ProcessFailed,
        'Failed to create product',
        500,
      );
    }
  }

  /**
   * Get all products with pagination and filtering
   */
  async getProducts(query: GetProductsRequest): Promise<PaginationResponse<ProductDto>> {
    const { page = 1, limit = 20, sortBy = 'createdAt', order = 'desc', category_id, search } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      isActive: true,
    };

    if (category_id) {
      where.product_category_id = category_id;
    }

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    // Build orderBy clause
    const orderBy: any = {};
    orderBy[sortBy] = order;

    try {
      // Get total count
      const total = await this.prisma.product.count({ where });

      // Get paginated data
      const products = await this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          category: true,
          variants: {
            where: { isActive: true },
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      // Create pagination metadata
      const paging: PageInfo = {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };

      // Transform raw data to DTOs
      const productDtos = products.map(product => new ProductDto(product));

      return new PaginationResponse(productDtos, paging);
    } catch (error) {
      throw new CustomError(
        ErrorCode.ProcessFailed,
        'Failed to fetch products',
        500,
      );
    }
  }
}