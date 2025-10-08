import { BadRequestException, Injectable, ValidationPipe } from "@nestjs/common";
import { getErrorMessage } from "@shared/constant/error-message.constant";
import { ErrorCode } from "@shared/enum/error-code.enum";
import { ValidationError } from "class-validator";

/**
 * Describe options
 *
 * @param whitelist: Remove fields don't inside DTO.
 * @param forbidNonWhitelisted: Prevent request if existed field don't expect.
 * @param transform: Parse the input data type for Param, DTO.
 * @param enableImplicitConversion: Auto parse to the data type to DTO without cast.
 */
@Injectable()
export class CustomValidationPipe extends ValidationPipe {
  constructor() {
    super({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors: ValidationError[]) => {
        return new BadRequestException({
          message: getErrorMessage(ErrorCode.ValidationFailed),
          errors: errors.map((error) => ({
            property: error.property,
            constraints: error.constraints,
          })),
        });
      },
    });
  }
}
