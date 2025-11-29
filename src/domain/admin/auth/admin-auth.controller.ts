import { Body, Controller, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { AdminAuthService } from './admin-auth.service';
import { Public } from '@core/decorator/public.decorator';
import { ApiExtraModelsCustom, ApiResponseCustom } from '@core/decorator/doc.decorator';
import { adminAuthResponses } from './response/index.responses';
import { AdminLoginRequest } from './request/admin-login.request';
import { AdminAuthResponse } from './response/admin-auth.response';
import { AdminSignupRequest } from './request/admin-signup.request';
import { RefreshTokenRequest } from '@domain/auth/request/refresh-token.request';

@ApiTags('Admin Auth')
@Controller({ path: 'admin/authentication', version: ApiVersion.V1 })
@ApiExtraModelsCustom(...adminAuthResponses)
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Public()
  @Post('login')
  @ApiOperation({ summary: 'Admin login (bypass all verification)' })
  @ApiBody({ type: AdminLoginRequest })
  @ApiResponseCustom(AdminAuthResponse)
  async adminLogin(
    @Body() body: AdminLoginRequest,
  ) {
    return this.adminAuthService.adminLogin(body);
  }

  @Public()
  @Post('signup')
  @ApiOperation({
    summary: 'Admin signup (bypass all verification, instantly active)',
  })
  @ApiBody({ type: AdminSignupRequest })
  @ApiResponseCustom(AdminAuthResponse)
  async adminSignup(
    @Body() body: AdminSignupRequest,
  ) {
    return this.adminAuthService.adminSignup(body);
  }

  @Public()
  @Post('refresh-token')
  @ApiOperation({ summary: 'Admin refresh token' })
  @ApiBody({ type: RefreshTokenRequest })
  @ApiResponseCustom(AdminAuthResponse)
  async refreshToken(
    @Body() body: RefreshTokenRequest,
  ) {
    return this.adminAuthService.refreshNewToken(body);
  }
}
