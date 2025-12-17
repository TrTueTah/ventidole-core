import { Injectable } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { GetAddressesDto } from './dto/get-addresses.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(private readonly prisma: PrismaService) {}

  async createAddress(userId: string, dto: CreateAddressDto) {
    // Verify province and district exist
    const province = await this.prisma.province.findUnique({
      where: { code: dto.provinceCode },
    });

    if (!province) {
      throw new CustomError(
        ErrorCode.ResourceNotFound,
        `Province with code ${dto.provinceCode} not found`,
      );
    }

    const district = await this.prisma.district.findUnique({
      where: { code: dto.districtCode },
    });

    if (!district) {
      throw new CustomError(
        ErrorCode.ResourceNotFound,
        `District with code ${dto.districtCode} not found`,
      );
    }

    if (district.provinceCode !== dto.provinceCode) {
      throw new CustomError(
        ErrorCode.ResourceNotFound,
        `District ${dto.districtCode} does not belong to province ${dto.provinceCode}`,
      );
    }

    // If this address should be default, unset other default addresses
    if (dto.isDefaultAddress) {
      await this.prisma.address.updateMany({
        where: {
          userId,
          isDefaultAddress: true,
          isDeleted: false,
        },
        data: {
          isDefaultAddress: false,
        },
      });
    }

    return this.prisma.address.create({
      data: {
        userId,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        provinceCode: dto.provinceCode,
        districtCode: dto.districtCode,
        detailAddress: dto.detailAddress,
        isDefaultAddress: dto.isDefaultAddress ?? false,
        options: dto.options,
      },
      include: {
        province: true,
        district: true,
      },
    });
  }

  async getAddresses(
    userId: string,
    filters: GetAddressesDto,
  ): Promise<PaginationResponse<any>> {
    const { offset, limit, page } = filters;

    const [addresses, total] = await Promise.all([
      this.prisma.address.findMany({
        where: {
          userId,
          isDeleted: false,
        },
        include: {
          province: true,
          district: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.address.count({
        where: {
          userId,
          isDeleted: false,
        },
      }),
    ]);

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(addresses, pageInfo);
  }

  async getAddressById(userId: string, addressId: string) {
    const address = await this.prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
        isDeleted: false,
      },
      include: {
        province: true,
        district: true,
      },
    });

    if (!address) {
      throw new CustomError(
        ErrorCode.ResourceNotFound,
        `Address with id ${addressId} not found`,
      );
    }

    return address;
  }

  async updateAddress(
    userId: string,
    addressId: string,
    dto: UpdateAddressDto,
  ) {
    const address = await this.getAddressById(userId, addressId);

    // Verify province and district if provided
    if (dto.provinceCode !== undefined) {
      const province = await this.prisma.province.findUnique({
        where: { code: dto.provinceCode },
      });

      if (!province) {
        throw new CustomError(
          ErrorCode.ResourceNotFound,
          `Province with code ${dto.provinceCode} not found`,
        );
      }
    }

    if (dto.districtCode !== undefined) {
      const district = await this.prisma.district.findUnique({
        where: { code: dto.districtCode },
      });

      if (!district) {
        throw new CustomError(
          ErrorCode.ResourceNotFound,
          `District with code ${dto.districtCode} not found`,
        );
      }

      const provinceCode = dto.provinceCode ?? address.provinceCode;
      if (district.provinceCode !== provinceCode) {
        throw new CustomError(
          ErrorCode.ResourceNotFound,
          `District ${dto.districtCode} does not belong to province ${provinceCode}`,
        );
      }
    }

    // If this address should be default, unset other default addresses
    if (dto.isDefaultAddress) {
      await this.prisma.address.updateMany({
        where: {
          userId,
          isDefaultAddress: true,
          isDeleted: false,
          id: {
            not: addressId,
          },
        },
        data: {
          isDefaultAddress: false,
        },
      });
    }

    return this.prisma.address.update({
      where: {
        id: addressId,
      },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        provinceCode: dto.provinceCode,
        districtCode: dto.districtCode,
        detailAddress: dto.detailAddress,
        isDefaultAddress: dto.isDefaultAddress,
        options: dto.options,
      },
      include: {
        province: true,
        district: true,
      },
    });
  }

  async deleteAddress(userId: string, addressId: string) {
    await this.getAddressById(userId, addressId);

    return this.prisma.address.update({
      where: {
        id: addressId,
      },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async getProvinces() {
    return this.prisma.province.findMany({
      where: {
        isDeleted: false,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async getDistrictsByProvinceCode(provinceCode: number) {
    const province = await this.prisma.province.findUnique({
      where: { code: provinceCode },
    });

    if (!province) {
      throw new CustomError(
        ErrorCode.ResourceNotFound,
        `Province with code ${provinceCode} not found`,
      );
    }

    return this.prisma.district.findMany({
      where: {
        provinceCode,
        isDeleted: false,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }
}
