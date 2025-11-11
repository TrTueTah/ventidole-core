import { ApiBodyCustom, ApiExtraModelsCustom, ApiResponseCustom } from "@core/decorator/doc.decorator";
import { Public } from "@core/decorator/public.decorator";
import { Body, Controller, Post } from "@nestjs/common";
import { ApiBody, ApiTags } from "@nestjs/swagger";
import { ApiVersion } from "@shared/enum/api-version.enum";
import { AuthService } from "./auth.service";
import { SignInResponse } from "./response/sign-in.response";
import { SignInRequest } from "./request/sign-in.request";
import { SignUpRequest } from "./request/sign-up.request";
import { VerificationCodeResponse } from "./response/verification-code.response";
import { SendVerificationRequest } from "./request/send-verification.request";
import { ConfirmVerificationResponse } from "./response/confirm-verification.response";
import { ConfirmVerificationRequest } from "./request/confirm-verification.request";
import { RefreshTokenRequest } from "./request/refresh-token.request";
import { ResetPasswordRequest } from "./request/reset-password.request";
import { authResponses } from "./response/index.responses";

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
}