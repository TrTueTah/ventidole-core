/**
 * Exception Detail Interface
 *
 * Core structure for exception details.
 */
export interface IExceptionDetail {
  statusCode: number;
  errorCode: string;
  message: string;
}

/**
 * Exception Interface
 *
 * Complete exception information for logging.
 */
export interface IException extends IExceptionDetail {
  method: string;
  path: string;
  timestamp: string;
  exception: unknown;
}
