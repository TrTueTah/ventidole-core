import { CustomHttpException } from '@core/exception/custom-http.exception';
import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IRequest } from '@shared/interface/request.interface';
import { JsonWebTokenError, TokenExpiredError } from 'jsonwebtoken';
import { Role } from 'src/db/prisma/enums';
import { DecoratorKey } from '../types/decorator-key.enum';
import { CoreErrorCode } from '../types/error-code.enum';
import { TokenStrategyKey } from '../types/token.enum';

@Injectable()
export class JwtAuthGuard extends AuthGuard(TokenStrategyKey.Jwt) {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Authentication & Authorization flow
   *
   * @description
   * 1. Check if route is marked as @Public()
   *    - If public: try to authenticate (optional), but don't fail if no token
   *    - If not public: authenticate (required)
   * 2. Always authenticate by JWT first
   * 3. If `Roles` decorator is set, additionally check if user has required role
   * 4. If no `Roles` decorator, allow any authenticated user
   */
  async canActivate(context: ExecutionContext) {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      DecoratorKey.Public,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      // For public routes, try to authenticate but don't fail if no token
      try {
        await super.canActivate(context);
      } catch (error) {
        // If authentication fails on a public route, allow access anyway
        // This allows optional authentication - user will be undefined
      }
      return true;
    }

    // Always authenticate for non-public routes
    const isAuthenticated = await super.canActivate(context);
    if (!isAuthenticated) return false;

    const request = context.switchToHttp().getRequest<IRequest>();
    const user = request.user;

    if (!user) throw new ForbiddenException(CoreErrorCode.Unauthenticated);

    // Check for required roles
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
      DecoratorKey.Roles,
      [context.getHandler(), context.getClass()],
    );

    // If no roles specified, allow any authenticated user
    if (!requiredRoles || requiredRoles.length === 0) return true;

    // Check if user has one of the required roles
    if (requiredRoles.includes(user.role)) return true;

    throw new UnauthorizedException(
      new CustomHttpException(CoreErrorCode.Unauthorized, user.role),
    );
  }

  handleRequest(err, user, info, context: ExecutionContext) {
    // Check if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      DecoratorKey.Public,
      [context.getHandler(), context.getClass()],
    );

    // For public routes, return user if available, otherwise return null
    if (isPublic) {
      return user || null;
    }

    // For protected routes, enforce authentication
    if (info instanceof TokenExpiredError)
      throw new UnauthorizedException(CoreErrorCode.TokenExpired);

    if (info instanceof JsonWebTokenError)
      throw new UnauthorizedException(CoreErrorCode.InvalidToken);

    if (err || !user)
      throw new ForbiddenException(CoreErrorCode.Unauthenticated);

    return user;
  }
}
