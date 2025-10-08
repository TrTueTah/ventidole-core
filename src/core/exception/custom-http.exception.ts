import { ErrorCode } from "@shared/enum/error-code.enum";

export class CustomHttpException<T> {
  errorCode: ErrorCode;
  params: T[];

  constructor(errorCode: ErrorCode, ...params: T[]) {
    this.errorCode = errorCode;
    this.params = params;
  }
}
