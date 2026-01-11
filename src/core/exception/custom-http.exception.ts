/**
 * Custom HTTP Exception
 *
 * HTTP exception wrapper that carries error code and parameters.
 * Can be used with any error code type (core or application-specific).
 */
export class CustomHttpException<T> {
  errorCode: string;
  params: T[];

  constructor(errorCode: string, ...params: T[]) {
    this.errorCode = errorCode;
    this.params = params;
  }
}
