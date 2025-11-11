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
import { Role } from "src/db/prisma/enums";

@Injectable()
export class JwtAuthGuard extends AuthGuard(TokenStrategyKey.Jwt) {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Authentication & Authorization flow
   *
   * @description
   * 1. Check if route is marked as @Public() - if yes, skip authentication
   * 2. Otherwise, always authenticate by JWT first
   * 3. If `Roles` decorator is set, additionally check if user has required role
   * 4. If no `Roles` decorator, allow any authenticated user
   */
  async canActivate(context: ExecutionContext) {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(DecoratorKey.Public, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) return true;

    // Always authenticate for non-public routes
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    const request = context.switchToHttp().getRequest<IRequest>();
    const user = request.user;

    if (!user) throw new ForbiddenException(getErrorMessage(ErrorCode.Unauthenticated));

    // Check for required roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(DecoratorKey.Roles, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If no roles specified, allow any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // Check if user has one of the required roles
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
