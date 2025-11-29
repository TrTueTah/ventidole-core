import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { StreamChatService } from './stream-chat.service';
import { JwtAuthGuard } from '@core/guard/jwt-auth.guard';
import { IRequest } from '@shared/interface/request.interface';
import { GenerateTokenRequest } from './request/generate-token.request';
import { CreateUserRequest } from './request/create-user.request';
import { TokenResponse } from './response/token.response';
import { UserResponse } from './response/user.response';
import { BaseResponse } from '@shared/helper/response';

@ApiTags('Stream Chat')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('stream-chat')
export class StreamChatController {
  constructor(private readonly streamChatService: StreamChatService) {}

  @Post('token')
  @ApiOperation({ summary: 'Generate Stream Chat authentication token' })
  @ApiResponse({ status: 200, type: TokenResponse, description: 'Token generated successfully' })
  @ApiResponse({ status: 400, description: 'Missing userId' })
  @ApiResponse({ status: 500, description: 'Token generation failed' })
  async generateToken(
    @Body() body: GenerateTokenRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<TokenResponse>> {
    // Use the userId from the authenticated user instead of the request body for security
    const userId = request.user.id;
    return this.streamChatService.generateToken(userId);
  }

  @Post('user')
  @ApiOperation({ summary: 'Create or update Stream Chat user profile' })
  @ApiResponse({ status: 200, type: UserResponse, description: 'User created/updated successfully' })
  @ApiResponse({ status: 400, description: 'Missing required fields' })
  @ApiResponse({ status: 500, description: 'User creation/update failed' })
  async createOrUpdateUser(
    @Body() body: CreateUserRequest,
    @Req() request: IRequest,
  ): Promise<BaseResponse<UserResponse>> {
    // Use the userId from the authenticated user for security
    const userId = request.user.id;
    return this.streamChatService.createOrUpdateUser(userId, body.name, body.image);
  }
}
