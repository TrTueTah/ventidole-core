import { CustomHttpException } from "@core/exception/custom-http.exception";
import { ExecutionContext, ForbiddenException, Injectable, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard } from "@nestjs/passport";
import { getErrorMessage } from "@shared/constant/error-message.constant";
import { DecoratorKey } from "@shared/enum/decorator.enum";
import { ErrorCode } from "@shared/enum/error-code.enum";
import { TokenStrategyKey } from "@shared/enum/token.enum";
import { IRequest } from "@shared/interface/request.interface";
import { JsonWebTokenError, TokenExpiredError } from "jsonwebtoken";
import { Role } from "src/generated/prisma/enums";

@Injectable()
export class JwtAuthGuard extends AuthGuard(TokenStrategyKey.Jwt) {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Authentication & Authorization flow
   *
   * @description
   * If do not set `Roles` decorator on route handler, it is the public API.
   * Otherwise, it authentication by JWT. Afterward, authorization rely on current role.
   */
  async canActivate(context: ExecutionContext) {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(DecoratorKey.Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles) return true;

    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    const request = context.switchToHttp().getRequest<IRequest>();
    const user = request.user;

    if (!user) throw new ForbiddenException(getErrorMessage(ErrorCode.Unauthenticated));

    if (requiredRoles.includes(user.role)) return true;

    throw new UnauthorizedException(new CustomHttpException(ErrorCode.Unauthorized, user.role));
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    if (info instanceof TokenExpiredError) throw new UnauthorizedException(ErrorCode.TokenExpired);

    if (info instanceof JsonWebTokenError) throw new UnauthorizedException(ErrorCode.InvalidToken);

    if (err || !user) throw new ForbiddenException(ErrorCode.Unauthenticated);

    return user;
  }
}
