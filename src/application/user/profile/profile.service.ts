import { Injectable, NotFoundException } from '@nestjs/common';
import { UserRepository } from '@domain/identity/user/user.repository';
import { UserId } from '@domain/shared/value-objects/user-id.vo';
import { CanUpdateProfilePolicy } from '@domain/identity/user/policies/can-update-profile.policy';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UserAggregate } from '@domain/identity/user/user.aggregate';

/**
 * Profile Application Service
 *
 * Orchestrates use cases related to user profiles.
 *
 * Responsibilities:
 * - Validate input (DTOs)
 * - Check policies
 * - Load/create aggregates
 * - Execute business logic
 * - Persist changes
 * - Map to response DTOs
 *
 * This is the APPLICATION layer - it can use DTOs, handle pagination,
 * and orchestrate complex workflows.
 */
@Injectable()
export class ProfileApplicationService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly canUpdateProfile: CanUpdateProfilePolicy,
  ) {}

  /**
   * Get user profile by ID
   *
   * @param userId - ID of the user to retrieve
   * @returns User profile
   */
  async getProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.userRepository.findById(UserId.fromString(userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return this.mapToDto(user);
  }

  /**
   * Update user profile
   *
   * @param requesterId - ID of the user making the request
   * @param targetUserId - ID of the user being updated
   * @param dto - Update data
   * @returns Updated user profile
   */
  async updateProfile(
    requesterId: string,
    targetUserId: string,
    dto: UpdateProfileDto,
  ): Promise<UserResponseDto> {
    // 1. Check policy
    await this.canUpdateProfile.check(requesterId, targetUserId);

    // 2. Load aggregate
    const user = await this.userRepository.findById(UserId.fromString(targetUserId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 3. Execute business logic
    user.updateProfile({
      username: dto.username,
      avatarUrl: dto.avatarUrl,
      backgroundUrl: dto.backgroundUrl,
      bio: dto.bio,
    });

    // 4. Persist
    await this.userRepository.save(user);

    // 5. Return DTO
    return this.mapToDto(user);
  }

  /**
   * Set user online status
   *
   * @param userId - ID of the user
   */
  async setOnline(userId: string): Promise<void> {
    const user = await this.userRepository.findById(UserId.fromString(userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.setOnline();
    await this.userRepository.save(user);
  }

  /**
   * Set user offline status
   *
   * @param userId - ID of the user
   */
  async setOffline(userId: string): Promise<void> {
    const user = await this.userRepository.findById(UserId.fromString(userId));

    if (!user) {
      throw new NotFoundException('User not found');
    }

    user.setOffline();
    await this.userRepository.save(user);
  }

  /**
   * Map domain aggregate to response DTO
   */
  private mapToDto(user: UserAggregate): UserResponseDto {
    return {
      id: user.id.value,
      email: user.email.value,
      username: user.username.value,
      role: user.role.value,
      profile: {
        avatarUrl: user.profile.avatarUrl,
        backgroundUrl: user.profile.backgroundUrl,
        bio: user.profile.bio,
        isOnline: user.profile.isOnline,
        lastOnlineAt: user.profile.lastOnlineAt,
      },
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
