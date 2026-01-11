import { CurrentUser } from '@core/decorator/current-user.decorator';
import { Public } from '@core/decorator/public.decorator';
import { JwtAuthGuard } from '@core/guard/jwt-auth.guard';
import { BaseResponse } from '@core/response/base-response';
import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiExtraModelsCustom, ApiResponseCustom } from '@core/decorator/doc.decorator';
import { AuthApplicationService } from './auth.service';
import { StreamChatService } from '@infra/stream-chat/stream-chat.service';
import { getStreamChatApiKey } from '@core/config/stream-chat.config';
import {
  AuthResponseDto,
  ChangePasswordDto,
  ConfirmVerificationDto,
  LoginDto,
  RegisterDto,
  ResetPasswordDto,
  SendVerificationDto,
  StreamChatTokenResponseDto,
  TokenResponseDto,
  VerificationCodeResponseDto,
  UserInfoDto,
} from './dto';

/**
 * Auth Controller
 *
 * HTTP endpoints for authentication.
 *
 * Endpoints:
 * - POST /auth/register - Register new user
 * - POST /auth/login - Login user
 * - POST /auth/refresh - Refresh access token
 * - POST /auth/logout - Logout user (clear tokens)
 */
@ApiTags('Authentication')
@ApiExtraModelsCustom(
  AuthResponseDto,
  TokenResponseDto,
  VerificationCodeResponseDto,
  UserInfoDto,
  StreamChatTokenResponseDto,
)
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthApplicationService,
    private readonly streamChatService: StreamChatService,
  ) {}

  /**
   * Register new user
   */
  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @ApiResponseCustom(AuthResponseDto)
  async register(
    @Body() dto: RegisterDto,
  ): Promise<BaseResponse<AuthResponseDto>> {
    const result = await this.authService.register(dto);
    return BaseResponse.of(result);
  }

  /**
   * Login user
   */
  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @ApiResponseCustom(AuthResponseDto)
  async login(@Body() dto: LoginDto): Promise<BaseResponse<AuthResponseDto>> {
    const result = await this.authService.login(dto);
    return BaseResponse.of(result);
  }

  /**
   * Refresh access token
   */
  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponseCustom(TokenResponseDto)
  async refreshToken(
    @Body('refreshToken') refreshToken: string,
  ): Promise<BaseResponse<TokenResponseDto>> {
    const result = await this.authService.refreshToken(refreshToken);
    return BaseResponse.of(result);
  }

  /**
   * Logout user
   * Note: In a stateless JWT system, logout is typically handled client-side
   * by removing the tokens. This endpoint is provided for completeness.
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('logout')
  @ApiOperation({ summary: 'Logout user (client-side token removal)' })
  @ApiResponseCustom()
  async logout(@CurrentUser('id') userId: string): Promise<BaseResponse<void>> {
    // In a stateless JWT system, logout is handled client-side
    // This endpoint can be used for logging or analytics
    console.log(`User ${userId} logged out`);
    return BaseResponse.ok();
  }

  /**
   * Send verification code
   */
  @Public()
  @Post('send-verification')
  @ApiOperation({ summary: 'Send verification code to email' })
  @ApiResponseCustom(VerificationCodeResponseDto)
  async sendVerification(
    @Body() dto: SendVerificationDto,
  ): Promise<BaseResponse<VerificationCodeResponseDto>> {
    const result = await this.authService.sendVerification(dto);
    return BaseResponse.of(result);
  }

  /**
   * Confirm verification code
   */
  @Public()
  @Post('confirm-verification')
  @ApiOperation({ summary: 'Confirm verification code' })
  @ApiResponseCustom()
  async confirmVerification(
    @Body() dto: ConfirmVerificationDto,
  ): Promise<BaseResponse<void>> {
    await this.authService.confirmVerification(dto);
    return BaseResponse.ok();
  }

  /**
   * Reset password
   */
  @Public()
  @Post('reset-password')
  @ApiOperation({ summary: 'Reset password using verification code' })
  @ApiResponseCustom()
  async resetPassword(
    @Body() dto: ResetPasswordDto,
  ): Promise<BaseResponse<void>> {
    await this.authService.resetPassword(dto);
    return BaseResponse.ok();
  }

  /**
   * Change password
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @ApiOperation({ summary: 'Change password (authenticated user)' })
  @ApiResponseCustom()
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() dto: ChangePasswordDto,
  ): Promise<BaseResponse<void>> {
    await this.authService.changePassword(userId, dto);
    return BaseResponse.ok();
  }

  /**
   * Get current user (test endpoint)
   */
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponseCustom(UserInfoDto)
  async getCurrentUser(@CurrentUser() user: any): Promise<BaseResponse<any>> {
    return BaseResponse.of(user);
  }

  /**
   * Get Stream Chat authentication token
   *
   * Returns a token that allows the authenticated user to connect to Stream Chat.
   * This is part of the identity/authentication domain - providing credentials
   * for accessing external systems.
   */
  @Get('stream-chat-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get Stream Chat authentication token' })
  @ApiResponseCustom(StreamChatTokenResponseDto)
  async getStreamChatToken(
    @CurrentUser('id') userId: string,
  ): Promise<BaseResponse<StreamChatTokenResponseDto>> {
    // Generate Stream Chat token for the authenticated user
    const token = await this.streamChatService.generateUserToken(userId);

    const response: StreamChatTokenResponseDto = {
      token,
      apiKey: getStreamChatApiKey(),
      userId,
    };

    return BaseResponse.of(response);
  }
}
