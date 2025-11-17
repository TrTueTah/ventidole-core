import { Controller, Get, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { AdminUsersService } from './admin-users.service';
import { Roles } from '@core/decorator/role.decorator';
import { Role } from 'src/db/prisma/enums';
import { BaseResponse } from '@shared/helper/response';
import { ApiVersion } from '@shared/enum/api-version.enum';

@ApiTags('Admin Users')
@Controller({ path: 'admin/users', version: ApiVersion.V1 })
export class AdminUsersController {
  constructor(private readonly adminUsersService: AdminUsersService) {}

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('fans')
  @ApiOperation({ summary: 'Get all fans (Admin only)' })
  @ApiResponse({ status: 200 })
  async getAllFans(): Promise<BaseResponse<any[]>> {
    return this.adminUsersService.getAllFans();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all users with profiles (Admin only)' })
  @ApiResponse({ status: 200 })
  async getAllUsers(): Promise<BaseResponse<any[]>> {
    return this.adminUsersService.getAllUsers();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':userId/deactivate')
  @ApiOperation({ summary: 'Deactivate a user account (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200 })
  async deactivateUser(@Param('userId') userId: string): Promise<BaseResponse<unknown>> {
    return this.adminUsersService.deactivateUser(userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch(':userId/activate')
  @ApiOperation({ summary: 'Activate a user account (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200 })
  async activateUser(@Param('userId') userId: string): Promise<BaseResponse<unknown>> {
    return this.adminUsersService.activateUser(userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete(':userId')
  @ApiOperation({ summary: 'Delete a user account (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200 })
  async deleteUser(@Param('userId') userId: string): Promise<BaseResponse<unknown>> {
    return this.adminUsersService.deleteUser(userId);
  }
}