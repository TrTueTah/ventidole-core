import { SetMetadata } from '@nestjs/common';
import { DecoratorKey } from '@shared/enum/decorator.enum';

/**
 * Public route decorator
 * Use this decorator to mark routes that should be accessible without authentication
 * even when JwtAuthGuard is applied globally
 * 
 * @example
 * ```typescript
 * @Public()
 * @Post('login')
 * async login() {
 *   // This endpoint is public, no JWT required
 * }
 * ```
 */
export const Public = () => SetMetadata(DecoratorKey.Public, true);
