import { HttpStatus } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';

/**
 * Base Response
 *
 * Standard response wrapper for all API responses in the core layer.
 * Provides consistent structure across all endpoints.
 *
 * This is a TECHNICAL response wrapper (not business logic).
 * Used by: Exception filters, interceptors, controllers
 */
export class BaseResponse<T> {
  @ApiProperty({
    enum: HttpStatus,
    example: HttpStatus.OK,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({
    example: 'OK',
    description: 'Response message',
    type: String,
  })
  message: string;

  @ApiProperty({
    required: false,
    description: 'Response data (null if no data)',
    nullable: true,
    type: Object,
  })
  data: T | null;

  @ApiProperty({
    required: false,
    description: 'Error information (null on success)',
    type: Object,
  })
  error?: unknown;

  @ApiProperty({
    required: false,
    type: String,
    description: 'Error code (optional)',
  })
  errorCode?: string;

  private constructor(
    statusCode: number,
    message: string,
    data: T | null,
    error?: unknown,
    errorCode?: string,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.error = error;
    this.errorCode = errorCode;
  }

  /**
   * Create a successful response with data
   */
  public static of<T>(data: T): BaseResponse<T> {
    return new BaseResponse<T>(HttpStatus.OK, 'OK', data);
  }

  /**
   * Create an exception response
   */
  public static exception<T>(
    statusCode: number,
    errorCode: string,
    errorMessage: string,
    error: unknown,
  ): BaseResponse<T> {
    return new BaseResponse<T>(
      statusCode,
      errorMessage,
      null,
      error,
      errorCode,
    );
  }

  /**
   * Create a successful response without data
   */
  public static ok<T>(): BaseResponse<T> {
    return new BaseResponse<T>(HttpStatus.OK, 'OK', null);
  }

  /**
   * Create a created (201) response
   */
  public static created<T>(): BaseResponse<T> {
    return new BaseResponse<T>(HttpStatus.CREATED, 'CREATED', null);
  }

  /**
   * Create a fault response with custom message
   */
  public static fault<T>(errorMessage: string, data: T): BaseResponse<T> {
    return new BaseResponse<T>(
      HttpStatus.BAD_REQUEST,
      errorMessage,
      data,
      null,
    );
  }
}
