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
import { AdminUserService } from './admin-user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetUsersDto } from './dto/get-users.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDetailDto } from './dto/user-detail.dto';
import { UserDto } from './dto/user.dto';

@ApiBearerAuth()
@ApiTags('Admin User Management')
@Controller({ path: 'admin/user', version: ApiVersion.V1 })
@ApiExtraModelsCustom(UserDto, UserDetailDto, CreateUserDto, UpdateUserDto)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  @ApiPaginationResponse(UserDto)
  async getAllUsers(
    @Query() filters: GetUsersDto,
  ): Promise<PaginationResponse<UserDto>> {
    const result = await this.adminUserService.getAllUsers(filters);
    return result;
  }

  @Get(':id')
  @ApiResponseCustom(UserDetailDto)
  async getUserById(
    @Param('id') id: string,
  ): Promise<BaseResponse<UserDetailDto>> {
    const result = await this.adminUserService.getUserById(id);
    return BaseResponse.of(result);
  }

  @Post()
  @ApiResponseCustom(UserDetailDto)
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<BaseResponse<UserDetailDto>> {
    const result = await this.adminUserService.createUser(createUserDto);
    return BaseResponse.of(result);
  }

  @Patch(':id')
  @ApiResponseCustom(UserDto)
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<BaseResponse<UserDto>> {
    const result = await this.adminUserService.updateUser(id, updateUserDto);
    return BaseResponse.of(result);
  }

  @Delete(':id')
  @ApiResponseCustom()
  async deleteUser(@Param('id') id: string): Promise<BaseResponse<null>> {
    await this.adminUserService.deleteUser(id);
    return BaseResponse.ok();
  }
}
