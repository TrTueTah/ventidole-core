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
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { PaginationResponse } from '@shared/dto/pagination-response.dto';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { BaseResponse } from '@shared/helper/response';
import { IRequest } from '@shared/interface/request.interface';
import { AddressService } from './address.service';
import { AddressDto } from './dto/address.dto';
import { CreateAddressDto } from './dto/create-address.dto';
import { DistrictDto } from './dto/district.dto';
import { GetAddressesDto } from './dto/get-addresses.dto';
import { ProvinceDto } from './dto/province.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@ApiBearerAuth()
@ApiTags('User Addresses')
@Controller({ path: 'user/addresses', version: ApiVersion.V1 })
@ApiExtraModelsCustom(
  AddressDto,
  CreateAddressDto,
  UpdateAddressDto,
  ProvinceDto,
  DistrictDto,
)
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Post()
  @ApiResponseCustom(AddressDto)
  async createAddress(
    @Req() req: IRequest,
    @Body() dto: CreateAddressDto,
  ): Promise<BaseResponse<AddressDto>> {
    const result = await this.addressService.createAddress(req.user.id, dto);
    return BaseResponse.of(result);
  }

  @Get()
  @ApiPaginationResponse(AddressDto)
  async getAddresses(
    @Req() req: IRequest,
    @Query() query: GetAddressesDto,
  ): Promise<PaginationResponse<AddressDto>> {
    const result = await this.addressService.getAddresses(req.user.id, query);
    return result;
  }

  @Get('provinces')
  @ApiResponseCustom(ProvinceDto, true)
  async getProvinces(): Promise<BaseResponse<ProvinceDto[]>> {
    const result = await this.addressService.getProvinces();
    return BaseResponse.of(result);
  }

  @Get('provinces/:provinceCode/districts')
  @ApiResponseCustom(DistrictDto, true)
  async getDistrictsByProvinceCode(
    @Param('provinceCode') provinceCode: string,
  ): Promise<BaseResponse<DistrictDto[]>> {
    const result = await this.addressService.getDistrictsByProvinceCode(
      parseInt(provinceCode, 10),
    );
    return BaseResponse.of(result);
  }

  @Get(':id')
  @ApiResponseCustom(AddressDto)
  async getAddressById(
    @Req() req: IRequest,
    @Param('id') addressId: string,
  ): Promise<BaseResponse<AddressDto>> {
    const result = await this.addressService.getAddressById(
      req.user.id,
      addressId,
    );
    return BaseResponse.of(result);
  }

  @Patch(':id')
  @ApiResponseCustom(AddressDto)
  async updateAddress(
    @Req() req: IRequest,
    @Param('id') addressId: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<BaseResponse<AddressDto>> {
    const result = await this.addressService.updateAddress(
      req.user.id,
      addressId,
      dto,
    );
    return BaseResponse.of(result);
  }

  @Delete(':id')
  @ApiResponseCustom()
  async deleteAddress(
    @Req() req: IRequest,
    @Param('id') addressId: string,
  ): Promise<BaseResponse<null>> {
    await this.addressService.deleteAddress(req.user.id, addressId);
    return BaseResponse.ok();
  }
}
