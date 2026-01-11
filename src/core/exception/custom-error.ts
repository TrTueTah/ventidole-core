import { CoreErrorCode } from '../types/error-code.enum';

/**
 * Custom Error
 *
 * Core-level error class for technical errors.
 * Application-specific errors should extend this or use their own error classes.
 */
export class CustomError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly statusCode: number = 400,
    public readonly data?: any,
  ) {
    super(message);
    this.name = 'CustomError';

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CustomError);
    }
  }

  /**
   * Create a CustomError from a CoreErrorCode
   */
  static fromCoreErrorCode(
    code: CoreErrorCode,
    message?: string,
    statusCode?: number,
  ): CustomError {
    return new CustomError(code, message || code, statusCode || 400);
  }
}
