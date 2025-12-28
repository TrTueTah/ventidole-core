import {
  ApiExtraModelsCustom,
  ApiResponseCustom,
} from '@core/decorator/doc.decorator';
import { Public } from '@core/decorator/public.decorator';
import { Body, Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { ApiVersion } from '@shared/enum/api-version.enum';
import { IRequest } from '@shared/interface/request.interface';
import { AuthService } from './auth.service';
import { ChangePasswordRequest } from './request/change-password.request';
import { ConfirmVerificationRequest } from './request/confirm-verification.request';
import { RefreshTokenRequest } from './request/refresh-token.request';
import { ResetPasswordRequest } from './request/reset-password.request';
import { SendVerificationRequest } from './request/send-verification.request';
import { SignInRequest } from './request/sign-in.request';
import { SignUpRequest } from './request/sign-up.request';
import { ConfirmVerificationResponse } from './response/confirm-verification.response';
import { authResponses } from './response/index.responses';
import { SignInResponse } from './response/sign-in.response';
import { VerificationCodeResponse } from './response/verification-code.response';

@ApiTags('Authenticate')
@ApiExtraModelsCustom(...authResponses)
@Controller({ path: 'auth', version: ApiVersion.V1 })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('sign-in')
  @ApiResponseCustom(SignInResponse)
  @ApiBody({ type: SignInRequest })
  signIn(@Body() request: SignInRequest) {
    return this.authService.signIn(request);
  }

  @Public()
  @Post('sign-up')
  @ApiResponseCustom(SignInResponse)
  @ApiBody({ type: SignUpRequest })
  signUp(@Body() request: SignUpRequest) {
    return this.authService.signUp(request);
  }

  @Public()
  @Post('send-verification')
  @ApiResponseCustom(VerificationCodeResponse)
  @ApiBody({ type: SendVerificationRequest })
  sendVerification(@Body() request: SendVerificationRequest) {
    return this.authService.sendVerification(request);
  }

  @Public()
  @Post('confirm-verification')
  @ApiResponseCustom(ConfirmVerificationResponse)
  @ApiBody({ type: ConfirmVerificationRequest })
  confirmVerification(@Body() request: ConfirmVerificationRequest) {
    return this.authService.confirmVerification(request);
  }

  @Public()
  @Post('refresh-token')
  @ApiResponseCustom(SignInResponse)
  @ApiBody({ type: RefreshTokenRequest })
  refreshNewToken(@Body() request: RefreshTokenRequest) {
    return this.authService.refreshNewToken(request);
  }

  @Public()
  @Post('reset-password')
  @ApiResponseCustom()
  @ApiBody({ type: ResetPasswordRequest })
  resetPassword(@Body() request: ResetPasswordRequest) {
    return this.authService.resetPassword(request);
  }

  @ApiBearerAuth()
  @Post('change-password')
  @ApiResponseCustom()
  @ApiBody({ type: ChangePasswordRequest })
  changePassword(@Req() req: IRequest, @Body() request: ChangePasswordRequest) {
    return this.authService.changePassword(req.user.id, request);
  }

  @Public()
  @Post('admin/sign-in')
  @ApiResponseCustom(SignInResponse)
  @ApiBody({ type: SignInRequest })
  adminSignIn(@Body() request: SignInRequest) {
    return this.authService.signIn(request);
  }
}
