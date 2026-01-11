/**
 * Core Error Codes
 *
 * Technical error codes used by the core layer.
 * Application-specific error codes should be defined in the application layer.
 */
export enum CoreErrorCode {
  // Authentication & Authorization
  Unauthenticated = 'unauthenticated',
  Unauthorized = 'unauthorized',
  TokenExpired = 'token_expired',
  InvalidToken = 'invalid_token',
  InvalidDecodeToken = 'invalid_decode_token',
  InvalidTokenIssuer = 'invalid_token_issuer',

  // Validation
  ValidationFailed = 'validation_failed',

  // HTTP
  HttpError = 'http_error',

  // System
  UnknownError = 'unknown_error',
  InternalServerError = 'InternalServerError',
}

const CoreErrorCodeSet = new Set(Object.values(CoreErrorCode));

export const isCoreErrorCode = (value: string): value is CoreErrorCode =>
  CoreErrorCodeSet.has(value as CoreErrorCode);
