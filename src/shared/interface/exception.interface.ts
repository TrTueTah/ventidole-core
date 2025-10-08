import { ErrorCode } from "@shared/enum/error-code.enum";

export interface IException {
  statusCode: number;
  errorCode: ErrorCode;
  message: string;
  method: string;
  path: string;
  timestamp: string;
  exception: unknown;
}

export interface IExceptionDetail {
  statusCode: number;
  errorCode: ErrorCode;
  message: string;
}
