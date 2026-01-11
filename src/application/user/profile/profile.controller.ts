import { Controller, Get, Patch, Body, UseGuards, Param } from '@nestjs/common';
import { CurrentUser } from '@core/decorator/current-user.decorator';
import { ProfileApplicationService } from './profile.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { BaseResponse } from '@core/response/base-response';

/**
 * Profile Controller
 *
 * HTTP layer for user profile operations.
 *
 * Responsibilities:
 * - Validate HTTP requests
 * - Extract user ID from token/session
 * - Call application service
 * - Return standardized responses
 *
 * Note: This controller is THIN - all business logic is in the domain/application layers.
 */
@Controller('user/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileApplicationService) {}

  /**
   * Get current user's profile
   *
   * GET /user/profile
   */
  @Get()
  async getMyProfile(
    @CurrentUser('id') userId: string,
  ): Promise<BaseResponse<UserResponseDto>> {
    const profile = await this.profileService.getProfile(userId);
    return BaseResponse.of(profile);
  }

  /**
   * Get user profile by ID
   *
   * GET /user/profile/:userId
   */
  @Get(':userId')
  async getProfile(
    @Param('userId') userId: string,
  ): Promise<BaseResponse<UserResponseDto>> {
    const profile = await this.profileService.getProfile(userId);
    return BaseResponse.of(profile);
  }

  /**
   * Update current user's profile
   *
   * PATCH /user/profile
   */
  @Patch()
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ): Promise<BaseResponse<UserResponseDto>> {
    const profile = await this.profileService.updateProfile(userId, userId, dto);
    return BaseResponse.of(profile);
  }

  /**
   * Set user online
   *
   * POST /user/profile/online
   */
  @Patch('online')
  async setOnline(
    @CurrentUser('id') userId: string,
  ): Promise<BaseResponse<void>> {
    await this.profileService.setOnline(userId);
    return BaseResponse.ok();
  }

  /**
   * Set user offline
   *
   * POST /user/profile/offline
   */
  @Patch('offline')
  async setOffline(
    @CurrentUser('id') userId: string,
  ): Promise<BaseResponse<void>> {
    await this.profileService.setOffline(userId);
    return BaseResponse.ok();
  }
}
