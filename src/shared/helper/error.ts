import { getErrorMessage } from "@shared/constant/error-message.constant";
import { ErrorCode } from "@shared/enum/error-code.enum";

export class CustomError extends Error {
  public readonly errorCode: ErrorCode;

  constructor(errorCode: ErrorCode, ...param: unknown[]) {
    const message = getErrorMessage(errorCode, ...param);
    super(message);

    this.name = CustomError.name;
    this.errorCode = errorCode;
  }
}
