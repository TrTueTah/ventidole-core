import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { StreamChat } from 'stream-chat';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { BaseResponse } from '@shared/helper/response';
import { TokenResponse } from './response/token.response';
import { UserResponse } from './response/user.response';

@Injectable()
export class StreamChatService {
  private readonly logger = new Logger(StreamChatService.name);
  private readonly client: StreamChat;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('STREAM_CHAT_API_KEY');
    const secret = this.configService.get<string>('STREAM_CHAT_SECRET');

    if (!this.apiKey || !secret) {
      this.logger.error('Stream Chat API key or secret not configured');
      throw new Error('Stream Chat credentials not configured');
    }

    this.client = StreamChat.getInstance(this.apiKey, secret);
    this.logger.log('Stream Chat client initialized successfully');
  }

  /**
   * Generate a Stream Chat token for a user
   */
  async generateToken(userId: string): Promise<BaseResponse<TokenResponse>> {
    try {
      if (!userId) {
        throw new CustomError(ErrorCode.ValidationFailed);
      }

      // Generate token with 1 hour expiration
      const token = this.client.createToken(userId);

      const response: TokenResponse = {
        token,
        apiKey: this.apiKey,
        userId,
      };

      this.logger.log(`Generated Stream Chat token for user: ${userId}`);
      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error(`Failed to generate token for user ${userId}: ${error.message}`);
      throw new CustomError(ErrorCode.InternalServerError);
    }
  }

  /**
   * Create or update a user in Stream Chat
   */
  async createOrUpdateUser(
    userId: string,
    name: string,
    image?: string,
  ): Promise<BaseResponse<UserResponse>> {
    try {
      if (!userId || !name) {
        throw new CustomError(ErrorCode.ValidationFailed);
      }

      const userData: any = {
        id: userId,
        name,
        role: 'user',
      };

      if (image) {
        userData.image = image;
      }

      await this.client.upsertUser(userData);

      const response: UserResponse = {
        success: true,
        message: 'User created/updated successfully',
        userId,
      };

      this.logger.log(`Created/updated Stream Chat user: ${userId}`);
      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error(`Failed to create/update user ${userId}: ${error.message}`);
      throw new CustomError(ErrorCode.InternalServerError);
    }
  }

  /**
   * Delete a user from Stream Chat
   */
  async deleteUser(userId: string): Promise<BaseResponse<UserResponse>> {
    try {
      if (!userId) {
        throw new CustomError(ErrorCode.ValidationFailed);
      }

      await this.client.deleteUser(userId, {
        mark_messages_deleted: true,
        hard_delete: false,
      });

      const response: UserResponse = {
        success: true,
        message: 'User deleted successfully',
        userId,
      };

      this.logger.log(`Deleted Stream Chat user: ${userId}`);
      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error(`Failed to delete user ${userId}: ${error.message}`);
      throw new CustomError(ErrorCode.InternalServerError);
    }
  }

  /**
   * Deactivate a user in Stream Chat
   */
  async deactivateUser(userId: string): Promise<BaseResponse<UserResponse>> {
    try {
      if (!userId) {
        throw new CustomError(ErrorCode.ValidationFailed);
      }

      await this.client.deactivateUser(userId);

      const response: UserResponse = {
        success: true,
        message: 'User deactivated successfully',
        userId,
      };

      this.logger.log(`Deactivated Stream Chat user: ${userId}`);
      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error(`Failed to deactivate user ${userId}: ${error.message}`);
      throw new CustomError(ErrorCode.InternalServerError);
    }
  }

  /**
   * Reactivate a user in Stream Chat
   */
  async reactivateUser(userId: string): Promise<BaseResponse<UserResponse>> {
    try {
      if (!userId) {
        throw new CustomError(ErrorCode.ValidationFailed);
      }

      await this.client.reactivateUser(userId);

      const response: UserResponse = {
        success: true,
        message: 'User reactivated successfully',
        userId,
      };

      this.logger.log(`Reactivated Stream Chat user: ${userId}`);
      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error(`Failed to reactivate user ${userId}: ${error.message}`);
      throw new CustomError(ErrorCode.InternalServerError);
    }
  }

  /**
   * Get the Stream Chat client instance
   */
  getClient(): StreamChat {
    return this.client;
  }
}
