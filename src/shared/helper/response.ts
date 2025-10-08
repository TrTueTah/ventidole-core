import { HttpStatus } from "@nestjs/common";
import { ApiProperty } from "@nestjs/swagger";
import { ErrorCode } from "@shared/enum/error-code.enum";

export class BaseResponse<T> {
  @ApiProperty({ 
    enum: HttpStatus, 
    example: HttpStatus.OK,
    description: 'HTTP status code',
  })
  statusCode: number;

  @ApiProperty({ 
    example: "OK",
    description: 'Response message',
    type: String
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
    enum: ErrorCode,
    description: 'Error code (optional)'
  })
  errorCode?: ErrorCode;

  private constructor(statusCode: number, message: string, data: T | null, error?: unknown, errorCode?: ErrorCode) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.error = error;
    this.errorCode = errorCode;
  }

  public static of<T>(data: T): BaseResponse<T> {
    return new BaseResponse<T>(HttpStatus.OK, "OK", data);
  }

  public static exception<T>(
    statusCode: number,
    errorCode: ErrorCode,
    errorMessage: string,
    error: unknown,
  ): BaseResponse<T> {
    return new BaseResponse<T>(statusCode, errorMessage, null, error, errorCode);
  }

  public static ok<T>(): BaseResponse<T> {
    return new BaseResponse<T>(HttpStatus.OK, "OK", null);
  }

  public static created<T>(): BaseResponse<T> {
    return new BaseResponse<T>(HttpStatus.CREATED, "CREATED", null);
  }

  public static fault<T>(errorMessage: string, data: T) {
    return new BaseResponse<T>(HttpStatus.BAD_REQUEST, errorMessage, data, null);
  }
}
