# JWT Authentication Fix - request.user Undefined Issue

## Problem
After implementing JWT authentication, `request.user` was always undefined in protected endpoints, causing errors like:
```
Cannot read properties of undefined (reading 'id')
```

## Root Cause Analysis

### The Global Guard Issue
In `main.ts`, the application uses a **global JWT guard**:
```typescript
app.useGlobalGuards(new JwtAuthGuard(new Reflector()));
```

This means **every route** in the application goes through the `JwtAuthGuard`.

### The Original Guard Logic Problem
The original `JwtAuthGuard.canActivate()` had this logic:
```typescript
async canActivate(context: ExecutionContext) {
  const requiredRoles = this.reflector.getAllAndOverride<Role[]>(DecoratorKey.Roles, [
    context.getHandler(),
    context.getClass(),
  ]);

  if (!requiredRoles) return true;  // ❌ Returns without authentication!

  const isAuthenticated = await super.canActivate(context);
  // ... rest of the code
}
```

**The Bug**: When there's no `@Roles()` decorator, it returned `true` immediately **without calling `super.canActivate()`**, which meant:
- ❌ No JWT validation occurred
- ❌ `request.user` was never populated
- ❌ The route was treated as public

This design assumed:
- Routes WITHOUT `@Roles()` = Public (no auth needed)
- Routes WITH `@Roles()` = Protected (auth required)

But the chat controller used `@UseGuards(JwtAuthGuard)` without `@Roles()`, expecting authentication!

## The Complete Solution

### 1. Created `@Public()` Decorator
**File**: `src/core/decorator/public.decorator.ts`
```typescript
import { SetMetadata } from '@nestjs/common';
import { DecoratorKey } from '@shared/enum/decorator.enum';

export const Public = () => SetMetadata(DecoratorKey.Public, true);
```

This decorator explicitly marks routes that should be accessible without authentication.

### 2. Fixed `JwtAuthGuard` Logic
**File**: `src/core/guard/jwt-auth.guard.ts`

New authentication flow:
```typescript
async canActivate(context: ExecutionContext) {
  // 1️⃣ Check if route is marked as @Public()
  const isPublic = this.reflector.getAllAndOverride<boolean>(DecoratorKey.Public, [
    context.getHandler(),
    context.getClass(),
  ]);

  if (isPublic) return true;  // Skip authentication for public routes

  // 2️⃣ Always authenticate for non-public routes
  const isAuthenticated = await super.canActivate(context);
  if (!isAuthenticated) return false;

  const request = context.switchToHttp().getRequest<IRequest>();
  const user = request.user;

  if (!user) throw new ForbiddenException(getErrorMessage(ErrorCode.Unauthenticated));

  // 3️⃣ Check for required roles (if specified)
  const requiredRoles = this.reflector.getAllAndOverride<Role[]>(DecoratorKey.Roles, [
    context.getHandler(),
    context.getClass(),
  ]);

  // 4️⃣ If no roles specified, allow any authenticated user
  if (!requiredRoles || requiredRoles.length === 0) return true;

  // 5️⃣ Check if user has one of the required roles
  if (requiredRoles.includes(user.role)) return true;

  throw new UnauthorizedException(new CustomHttpException(ErrorCode.Unauthorized, user.role));
}
```

### 3. Updated Auth Controller
**File**: `src/domain/auth/auth.controller.ts`

Added `@Public()` to all public authentication endpoints:
```typescript
import { Public } from '@core/decorator/public.decorator';

@Controller({ path: 'auth', version: ApiVersion.V1 })
export class AuthController {
  @Public()
  @Post('sign-in')
  signIn(@Body() request: SignInRequest) { /* ... */ }

  @Public()
  @Post('sign-up')
  signUp(@Body() request: SignUpRequest) { /* ... */ }

  @Public()
  @Post('send-verification')
  sendVerification(@Body() request: SendVerificationRequest) { /* ... */ }

  @Public()
  @Post('confirm-verification')
  confirmVerification(@Body() request: ConfirmVerificationRequest) { /* ... */ }

  @Public()
  @Post('refresh-token')
  refreshNewToken(@Body() request: RefreshTokenRequest) { /* ... */ }

  @Public()
  @Post('reset-password')
  resetPassword(@Body() request: ResetPasswordRequest) { /* ... */ }
}
```

### 4. Updated Admin Controller
**File**: `src/domain/admin/admin.controller.ts`

Added `@Public()` to login and signup:
```typescript
import { Public } from '@core/decorator/public.decorator';

@Controller('admin')
export class AdminController {
  // Public endpoints
  @Public()
  @Post('login')
  async adminLogin(@Body() body: AdminLoginRequest) { /* ... */ }

  @Public()
  @Post('signup')
  async adminSignup(@Body() body: AdminSignupRequest) { /* ... */ }

  // Protected endpoints - require authentication and ADMIN role
  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Post('groups')
  async createGroup(@Body() body: CreateGroupRequest) { /* ... */ }

  @ApiBearerAuth()
  @Roles(Role.ADMIN)
  @Get('groups')
  async getAllGroups() { /* ... */ }

  // ... other admin endpoints with @Roles(Role.ADMIN)
}
```

### 5. Fixed Module Dependencies
Previously fixed in `ChatModule` and `FileModule`:
- ✅ Import `PassportModule`
- ✅ Provide `JwtStrategy`
- ✅ Don't directly provide `RedisService` (it's from global `RedisModule`)

## How It Works Now

### Authentication Flow Diagram
```
Request → Global JwtAuthGuard
           ↓
        Is @Public()?
           ↓
    Yes ← → No
     ↓         ↓
   Allow   Validate JWT
             ↓
          User Found?
             ↓
       Yes ← → No
        ↓         ↓
    Set user   Reject (401)
        ↓
    @Roles()?
        ↓
  Yes ← → No
   ↓         ↓
Check     Allow
Role    (any auth user)
   ↓
Match?
   ↓
Yes → No
 ↓     ↓
Allow Reject
      (403)
```

### Route Protection Patterns

#### 1. Public Routes (No Authentication)
```typescript
@Public()
@Post('login')
async login() {
  // No JWT required, anyone can access
}
```

#### 2. Protected Routes (Any Authenticated User)
```typescript
// No @Public(), no @Roles() = requires authentication, allows any role
@Post('chat/channels')
async createChannel(@Req() request: IRequest) {
  const userId = request.user.id;  // ✅ request.user is populated
  const userRole = request.user.role;  // ✅ Can be FAN, IDOL, or ADMIN
}
```

#### 3. Role-Restricted Routes
```typescript
@Roles(Role.ADMIN)  // Only ADMIN role allowed
@Post('admin/groups')
async createGroup() {
  // Only users with role: ADMIN can access
}

@Roles(Role.IDOL, Role.ADMIN)  // Multiple roles allowed
@Post('idol/posts')
async createPost() {
  // Users with role: IDOL or ADMIN can access
}
```

## Testing

### 1. Test Public Endpoint (No JWT)
```bash
curl -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password123"
  }'

# Expected: ✅ Success (no JWT required)
```

### 2. Test Protected Endpoint Without JWT
```bash
curl -X POST http://localhost:8080/chat/channels \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "type": "ANNOUNCEMENT"
  }'

# Expected: ❌ 401 Unauthorized (JWT required)
```

### 3. Test Protected Endpoint With Valid JWT
```bash
# First, get a token
TOKEN=$(curl -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password123"}' \
  | jq -r '.data.accessToken')

# Then use it
curl -X POST http://localhost:8080/chat/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "name": "Test Announcement",
    "type": "ANNOUNCEMENT"
  }'

# Expected: ✅ Success (JWT valid, request.user populated)
```

### 4. Test Role-Protected Endpoint
```bash
# Try with IDOL token (should fail)
curl -X POST http://localhost:8080/admin/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $IDOL_TOKEN" \
  -d '{
    "name": "Test Group"
  }'

# Expected: ❌ 403 Forbidden (role: IDOL not allowed)

# Try with ADMIN token (should succeed)
curl -X POST http://localhost:8080/admin/groups \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -d '{
    "name": "Test Group"
  }'

# Expected: ✅ Success (role: ADMIN is allowed)
```

## Verification Checklist

After rebuild and restart:
- ✅ Public endpoints work without JWT (`/admin/login`, `/auth/sign-in`, etc.)
- ✅ Protected endpoints reject requests without JWT (401)
- ✅ Protected endpoints populate `request.user` with valid JWT
- ✅ `request.user.id` and `request.user.role` are accessible
- ✅ Role-based access control works correctly
- ✅ Chat channel creation works for authenticated users
- ✅ Admin endpoints only accessible to ADMIN role

## Summary of Changes

### Files Modified
1. ✅ `src/core/decorator/public.decorator.ts` - Created
2. ✅ `src/core/guard/jwt-auth.guard.ts` - Fixed authentication logic
3. ✅ `src/domain/auth/auth.controller.ts` - Added @Public() decorators
4. ✅ `src/domain/admin/admin.controller.ts` - Added @Public() decorators
5. ✅ `src/domain/chat/chat.module.ts` - Fixed module dependencies (previous fix)
6. ✅ `src/domain/file/file.module.ts` - Fixed module dependencies (previous fix)
7. ✅ `src/domain/chat/chat.service.ts` - Added error handling (previous fix)

### Key Concepts
- **Global Guard**: Applied to all routes via `app.useGlobalGuards()`
- **@Public() Decorator**: Explicitly marks routes as public (no auth needed)
- **@Roles() Decorator**: Restricts routes to specific user roles
- **No Decorators**: Routes require authentication but allow any role
- **request.user**: Always populated for authenticated requests

## Best Practices Going Forward

### 1. For New Public Endpoints
Always add `@Public()` decorator:
```typescript
@Public()
@Post('new-public-endpoint')
async publicMethod() { }
```

### 2. For New Protected Endpoints (Any Role)
Just define the endpoint - no decorators needed:
```typescript
@Post('new-protected-endpoint')
async protectedMethod(@Req() request: IRequest) {
  const userId = request.user.id;  // Safe to access
}
```

### 3. For New Role-Restricted Endpoints
Add `@Roles()` decorator:
```typescript
@Roles(Role.ADMIN, Role.IDOL)
@Post('new-restricted-endpoint')
async restrictedMethod() {
  // Only ADMIN or IDOL can access
}
```

### 4. Always Use IRequest Type
```typescript
import { IRequest } from '@shared/interface/request.interface';

@Post('endpoint')
async method(@Req() request: IRequest) {
  // TypeScript will ensure request.user exists
  const userId = request.user.id;
  const userRole = request.user.role;
}
```

## Related Documentation
- [JWT_AUTH_FIX.md](./JWT_AUTH_FIX.md) - Module dependency fixes
- [API_RESPONSE_PATTERN.md](./API_RESPONSE_PATTERN.md) - API response standards
- [POST_ARCHITECTURE_SSOT.md](./POST_ARCHITECTURE_SSOT.md) - Architecture patterns
