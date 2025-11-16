import { Controller, Post, Get, Body, Param, Patch, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { Roles } from '@core/decorator/role.decorator';
import { Public } from '@core/decorator/public.decorator';
import { Role } from 'src/db/prisma/enums';
import { CreateIdolRequest, AdminLoginRequest, AdminSignupRequest, CreateGroupRequest } from './request/index.request';
import { CreateIdolResponse, AdminAuthResponse, CreateGroupResponse } from './response/index.response';
import { BaseResponse } from '@shared/helper/response';
import { ApiVersion } from '@shared/enum/api-version.enum';

@ApiTags('Admin')
@Controller({ path: 'admin', version: ApiVersion.V1 })
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  // Public endpoints (no authentication required)
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Admin login (bypass all verification)' })
  @ApiBody({ type: AdminLoginRequest })
  @ApiResponse({ status: 200, type: AdminAuthResponse })
  async adminLogin(
    @Body() body: AdminLoginRequest,
  ): Promise<BaseResponse<any>> {
    return this.adminService.adminLogin(body);
  }

  @Public()
  @Post('signup')
  @ApiOperation({ summary: 'Admin signup (bypass all verification, instantly active)' })
  @ApiBody({ type: AdminSignupRequest })
  @ApiResponse({ status: 201, type: AdminAuthResponse })
  async adminSignup(
    @Body() body: AdminSignupRequest,
  ): Promise<BaseResponse<any>> {
    return this.adminService.adminSignup(body);
  }

  // Protected endpoints (require ADMIN role)
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('groups')
  @ApiOperation({ summary: 'Create a new group (Admin only)' })
  @ApiBody({ type: CreateGroupRequest })
  @ApiResponse({ status: 201, type: CreateGroupResponse })
  async createGroup(
    @Body() body: CreateGroupRequest,
  ): Promise<BaseResponse<any>> {
    return this.adminService.createGroup(body);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('groups')
  @ApiOperation({ summary: 'Get all groups (Admin only)' })
  @ApiResponse({ status: 200 })
  async getAllGroups(): Promise<BaseResponse<any[]>> {
    return this.adminService.getAllGroups();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('idols')
  @ApiOperation({ summary: 'Create a new idol account (Admin only)' })
  @ApiBody({ type: CreateIdolRequest })
  @ApiResponse({ status: 201, type: CreateIdolResponse })
  async createIdolAccount(
    @Body() body: CreateIdolRequest,
  ): Promise<BaseResponse<any>> {
    return this.adminService.createIdolAccount(body);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('idols')
  @ApiOperation({ summary: 'Get all idols (Admin only)' })
  @ApiResponse({ status: 200 })
  async getAllIdols(): Promise<BaseResponse<any[]>> {
    return this.adminService.getAllIdols();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('fans')
  @ApiOperation({ summary: 'Get all fans (Admin only)' })
  @ApiResponse({ status: 200 })
  async getAllFans(): Promise<BaseResponse<any[]>> {
    return this.adminService.getAllFans();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('users')
  @ApiOperation({ summary: 'Get all users with profiles (Admin only)' })
  @ApiResponse({ status: 200 })
  async getAllUsers(): Promise<BaseResponse<any[]>> {
    return this.adminService.getAllUsers();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('statistics')
  @ApiOperation({ summary: 'Get platform statistics (Admin only)' })
  @ApiResponse({ status: 200 })
  async getStatistics(): Promise<BaseResponse<any>> {
    return this.adminService.getStatistics();
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('users/:userId/deactivate')
  @ApiOperation({ summary: 'Deactivate a user account (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200 })
  async deactivateUser(@Param('userId') userId: string): Promise<BaseResponse<unknown>> {
    return this.adminService.deactivateUser(userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Patch('users/:userId/activate')
  @ApiOperation({ summary: 'Activate a user account (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200 })
  async activateUser(@Param('userId') userId: string): Promise<BaseResponse<unknown>> {
    return this.adminService.activateUser(userId);
  }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Delete('users/:userId')
  @ApiOperation({ summary: 'Delete a user account (Admin only)' })
  @ApiParam({ name: 'userId', description: 'User ID' })
  @ApiResponse({ status: 200 })
  async deleteUser(@Param('userId') userId: string): Promise<BaseResponse<unknown>> {
    return this.adminService.deleteUser(userId);
  }
}
