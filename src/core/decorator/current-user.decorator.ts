import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Current User Decorator
 *
 * Extracts the current authenticated user from the request.
 *
 * Usage:
 * - @CurrentUser() user: User - Get entire user object
 * - @CurrentUser('id') userId: string - Get specific property
 * - @CurrentUser('email') email: string - Get specific property
 *
 * Note: Requires authentication guard to populate request.user
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? user[data] : user;
  },
);
