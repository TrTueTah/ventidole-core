import { ErrorCode } from "@shared/enum/error-code.enum";

const ErrorMessage: Record<ErrorCode, string | ((...param: unknown[]) => string)> = {
  [ErrorCode.Unauthenticated]: "User is not authenticated.",
  [ErrorCode.Unauthorized]: "User is not authorized.",
  [ErrorCode.ValidationFailed]: "Validation failed.",
  [ErrorCode.HttpError]: "Http request error",
  [ErrorCode.UnknownError]: "An unknown error occurred.",
  [ErrorCode.TokenExpired]: "Token has expired.",
  [ErrorCode.InvalidToken]: "Token is invalid.",
  [ErrorCode.NotAnyRecipient]: "There is no recipient to send email.",
  [ErrorCode.SendMailFailed]: "Failed to send email.",
  [ErrorCode.ConsumerNotFound]: "Consumer not found.",
  [ErrorCode.ConsumerFailed]: "Consumer process failed.",
  [ErrorCode.ProcessFailed]: "Process failed.",
  [ErrorCode.OtpAlreadyExist]: "OTP already exists.",
  [ErrorCode.OtpSpam]: "OTP request is too frequent. Please try again later.",
  [ErrorCode.OtpExpired]: "OTP has expired.",
  [ErrorCode.OtpIncorrect]: "OTP is incorrect.",
  [ErrorCode.InvalidDecodeToken]: "Decoded token is invalid.",
  [ErrorCode.InvalidTokenIssuer]: "Token issuer is invalid.",
  [ErrorCode.VerificationNotFound]: "Verification not found.",
  [ErrorCode.VerificationSessionExpired]: "Verification session has expired.",
  [ErrorCode.AccountNotFound]: "Account not found.",
  [ErrorCode.ExistedEmail]: "Email already exists.",
  [ErrorCode.ExistedPhoneNumber]: "Phone number already exists.",
  [ErrorCode.InvalidEmailOrPassword]: "Email or password is incorrect.",
  [ErrorCode.InvalidTokenSecret]: "Token secret is invalid.",
};

export function getErrorMessage(code: ErrorCode, ...param: unknown[]): string {
  const message = ErrorMessage[code];
  return typeof message === "function" ? message(...param) : message;
}
