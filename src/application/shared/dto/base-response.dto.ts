/**
 * Base Response DTO
 *
 * Standardized response wrapper for all API responses.
 */
export class BaseResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };

  private constructor(success: boolean, data?: T, error?: { code: string; message: string }) {
    this.success = success;
    this.data = data;
    this.error = error;
  }

  static of<T>(data: T): BaseResponse<T> {
    return new BaseResponse(true, data);
  }

  static ok(): BaseResponse<void> {
    return new BaseResponse(true);
  }

  static error(code: string, message: string): BaseResponse<void> {
    return new BaseResponse(false, undefined, { code, message });
  }
}
