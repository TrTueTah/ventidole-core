import { Injectable } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { GetProductsDto } from './dto/get-products.dto';
import { ProductDetailDto } from './dto/product-detail.dto';
import { ProductDto } from './dto/product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class AdminProductService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllProducts(
    filters: GetProductsDto,
  ): Promise<PaginationResponse<ProductDto>> {
    const {
      offset,
      limit,
      page,
      search,
      shopId,
      typeId,
      isActive,
      sortBy,
      sortOrder,
    } = filters;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
    };

    // Add search filter
    if (search) {
      whereClause.name = { contains: search, mode: 'insensitive' };
    }

    // Add shop filter
    if (shopId) {
      whereClause.shopId = shopId;
    }

    // Add type filter
    if (typeId) {
      whereClause.typeId = typeId;
    }

    // Add active status filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Build orderBy clause
    const orderByClause: Record<string, string> = {};
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'name',
      'price',
      'stock',
    ];

    if (sortBy && validSortFields.includes(sortBy)) {
      orderByClause[sortBy] = sortOrder || 'desc';
    } else {
      orderByClause.createdAt = 'desc';
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          description: true,
          price: true,
          stock: true,
          mediaUrls: true,
          shop: {
            select: {
              id: true,
              name: true,
              avatarUrl: true,
            },
          },
          type: {
            select: {
              id: true,
              name: true,
            },
          },
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: orderByClause,
        skip: offset,
        take: limit,
      }),
      this.prisma.product.count({
        where: whereClause,
      }),
    ]);

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(products, pageInfo);
  }

  async getProductById(id: string): Promise<ProductDetailDto> {
    const product = await this.prisma.product.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        mediaUrls: true,
        shop: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        variants: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            name: true,
            price: true,
            stock: true,
            isActive: true,
            createdAt: true,
            updatedAt: true,
          },
          orderBy: {
            createdAt: 'asc',
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
        version: true,
        metadata: true,
      },
    });

    if (!product) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Product not found',
      });
    }

    return {
      ...product,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      metadata: product.metadata as Record<string, any> | null,
    };
  }

  async createProduct(createProductDto: CreateProductDto): Promise<ProductDto> {
    // Verify shop exists
    const shop = await this.prisma.shop.findUnique({
      where: {
        id: createProductDto.shopId,
      },
      select: {
        id: true,
        isDeleted: true,
        isActive: true,
      },
    });

    if (!shop || shop.isDeleted || !shop.isActive) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Shop not found',
      });
    }

    let typeId = createProductDto.typeId;

    // Handle new type creation
    if (createProductDto.newType) {
      if (typeId) {
        throw new CustomError(ErrorCode.ValidationFailed, {
          message: 'Cannot specify both typeId and newType',
        });
      }

      const newProductType = await this.prisma.productType.create({
        data: {
          name: createProductDto.newType.name,
        },
      });
      typeId = newProductType.id;
    }

    // Verify product type exists if provided
    if (typeId) {
      const productType = await this.prisma.productType.findUnique({
        where: {
          id: typeId,
        },
        select: {
          id: true,
          isDeleted: true,
          isActive: true,
        },
      });

      if (!productType || productType.isDeleted || !productType.isActive) {
        throw new CustomError(ErrorCode.ValidationFailed, {
          message: 'Product type not found',
        });
      }
    }

    // Create product with variants
    const product = await this.prisma.product.create({
      data: {
        name: createProductDto.name,
        description: createProductDto.description,
        price: createProductDto.price,
        stock: createProductDto.stock,
        mediaUrls: createProductDto.mediaUrls,
        shopId: createProductDto.shopId,
        typeId: typeId,
        variants: createProductDto.variants?.length
          ? {
              create: createProductDto.variants.map((variant) => ({
                name: variant.name,
                price: variant.price,
                stock: variant.stock,
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        mediaUrls: true,
        shop: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return product;
  }

  async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductDto> {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id,
        isDeleted: false,
      },
      include: {
        variants: {
          where: {
            isDeleted: false,
          },
        },
      },
    });

    if (!existingProduct) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Product not found',
      });
    }

    let typeId = updateProductDto.typeId;

    // Handle new type creation
    if (updateProductDto.newType) {
      if (typeId) {
        throw new CustomError(ErrorCode.ValidationFailed, {
          message: 'Cannot specify both typeId and newType',
        });
      }

      const newProductType = await this.prisma.productType.create({
        data: {
          name: updateProductDto.newType.name,
        },
      });
      typeId = newProductType.id;
    }

    // Verify product type exists if provided
    if (typeId) {
      const productType = await this.prisma.productType.findUnique({
        where: {
          id: typeId,
        },
        select: {
          id: true,
          isDeleted: true,
          isActive: true,
        },
      });

      if (!productType || productType.isDeleted || !productType.isActive) {
        throw new CustomError(ErrorCode.ValidationFailed, {
          message: 'Product type not found',
        });
      }
    }

    // Handle variants update
    if (updateProductDto.variants !== undefined) {
      const existingVariantIds = existingProduct.variants.map((v) => v.id);
      const updatedVariantIds = updateProductDto.variants
        .filter((v) => v.id)
        .map((v) => v.id as string);

      // Soft delete variants not in the update list
      const variantsToDelete = existingVariantIds.filter(
        (id) => !updatedVariantIds.includes(id),
      );

      if (variantsToDelete.length > 0) {
        await this.prisma.productVariant.updateMany({
          where: {
            id: { in: variantsToDelete },
            productId: id,
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
          },
        });
      }

      // Update or create variants
      for (const variant of updateProductDto.variants) {
        if (variant.id) {
          // Update existing variant
          await this.prisma.productVariant.update({
            where: {
              id: variant.id,
              productId: id,
            },
            data: {
              name: variant.name,
              price: variant.price,
              stock: variant.stock,
              ...(variant.isActive !== undefined && {
                isActive: variant.isActive,
              }),
            },
          });
        } else {
          // Create new variant
          await this.prisma.productVariant.create({
            data: {
              name: variant.name,
              price: variant.price,
              stock: variant.stock,
              productId: id,
            },
          });
        }
      }
    }

    const product = await this.prisma.product.update({
      where: {
        id,
      },
      data: {
        ...(updateProductDto.name && { name: updateProductDto.name }),
        ...(updateProductDto.description !== undefined && {
          description: updateProductDto.description,
        }),
        ...(updateProductDto.price !== undefined && {
          price: updateProductDto.price,
        }),
        ...(updateProductDto.stock !== undefined && {
          stock: updateProductDto.stock,
        }),
        ...(updateProductDto.mediaUrls !== undefined && {
          mediaUrls: updateProductDto.mediaUrls,
        }),
        ...(typeId !== undefined && {
          typeId: typeId,
        }),
        ...(updateProductDto.isActive !== undefined && {
          isActive: updateProductDto.isActive,
        }),
      },
      select: {
        id: true,
        name: true,
        description: true,
        price: true,
        stock: true,
        mediaUrls: true,
        shop: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        type: {
          select: {
            id: true,
            name: true,
          },
        },
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return product;
  }

  async deleteProduct(id: string): Promise<void> {
    // Check if product exists
    const existingProduct = await this.prisma.product.findUnique({
      where: {
        id,
        isDeleted: false,
      },
    });

    if (!existingProduct) {
      throw new CustomError(ErrorCode.UserNotFound, {
        message: 'Product not found',
      });
    }

    // Soft delete product and its variants
    await this.prisma.$transaction([
      this.prisma.productVariant.updateMany({
        where: {
          productId: id,
          isDeleted: false,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      }),
      this.prisma.product.update({
        where: {
          id,
        },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
        },
      }),
    ]);
  }
}
