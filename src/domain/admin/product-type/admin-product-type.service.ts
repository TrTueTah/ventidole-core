import { Injectable } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CreateProductTypeDto } from './dto/create-product-type.dto';
import { GetProductTypesDto } from './dto/get-product-types.dto';
import {
  AdminProductTypeDetailDto,
  AdminProductTypeDto,
} from './dto/product-type.dto';
import { UpdateProductTypeDto } from './dto/update-product-type.dto';

@Injectable()
export class AdminProductTypeService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProductTypes(
    filters: GetProductTypesDto,
  ): Promise<PaginationResponse<AdminProductTypeDto>> {
    const { offset, limit, page, search, isActive } = filters;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
    };

    // Add search filter
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    // Add active status filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    const [productTypes, total] = await Promise.all([
      this.prisma.productType.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.productType.count({
        where: whereClause,
      }),
    ]);

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(productTypes, pageInfo);
  }

  async getProductTypeById(id: string): Promise<AdminProductTypeDetailDto> {
    const productType = await this.prisma.productType.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        version: true,
        _count: {
          select: {
            products: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    if (!productType) {
      throw new CustomError(ErrorCode.ValidationFailed, {
        message: 'Product type not found',
      });
    }

    return {
      id: productType.id,
      name: productType.name,
      isActive: productType.isActive,
      createdAt: productType.createdAt,
      updatedAt: productType.updatedAt,
      version: productType.version,
      productCount: productType._count.products,
    };
  }

  async createProductType(
    createDto: CreateProductTypeDto,
  ): Promise<AdminProductTypeDto> {
    const productType = await this.prisma.productType.create({
      data: {
        name: createDto.name,
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return productType;
  }

  async updateProductType(
    id: string,
    updateDto: UpdateProductTypeDto,
  ): Promise<AdminProductTypeDto> {
    // Check if product type exists
    const existingType = await this.prisma.productType.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingType) {
      throw new CustomError(ErrorCode.ValidationFailed, {
        message: 'Product type not found',
      });
    }

    const productType = await this.prisma.productType.update({
      where: {
        id,
      },
      data: {
        ...(updateDto.name && { name: updateDto.name }),
        ...(updateDto.isActive !== undefined && { isActive: updateDto.isActive }),
      },
      select: {
        id: true,
        name: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return productType;
  }

  async deleteProductType(id: string): Promise<void> {
    // Check if product type exists
    const existingType = await this.prisma.productType.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        _count: {
          select: {
            products: {
              where: {
                isDeleted: false,
              },
            },
          },
        },
      },
    });

    if (!existingType) {
      throw new CustomError(ErrorCode.ValidationFailed, {
        message: 'Product type not found',
      });
    }

    // Check if any products are using this type
    if (existingType._count.products > 0) {
      throw new CustomError(ErrorCode.ValidationFailed, {
        message: `Cannot delete product type: ${existingType._count.products} product(s) are using this type`,
      });
    }

    // Soft delete
    await this.prisma.productType.update({
      where: {
        id,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
