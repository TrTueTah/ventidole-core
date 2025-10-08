import { ConfirmVerificationRequest } from "./confirm-verification.request";
import { RefreshTokenRequest } from "./refresh-token.request";
import { ResetPasswordRequest } from "./reset-password.request";
import { SendVerificationRequest } from "./send-verification.request";
import { SignInRequest } from "./sign-in.request";
import { SignUpRequest } from "./sign-up.request";

export const authRequests = [
  ConfirmVerificationRequest,
  SendVerificationRequest,
  SignInRequest,
  SignUpRequest,
  RefreshTokenRequest,
  ResetPasswordRequest
]