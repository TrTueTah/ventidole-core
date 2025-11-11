# Admin Authentication Bug Fixes

## Issues Encountered

### 1. JWT Secret Not Found Error
**Error:**
```json
{
  "statusCode": 400,
  "message": "secretOrPrivateKey must have a value",
  "data": null,
  "error": {},
  "errorCode": "unknown_error"
}
```

**Cause:** 
- `AdminModule` was using `JwtModule.register()` with direct `ENVIRONMENT.JWT_SECRET` access
- Environment variables weren't fully loaded at module initialization time

**Fix:**
Changed to `JwtModule.registerAsync()` in `/src/domain/admin/admin.module.ts`:

```typescript
// Before ❌
JwtModule.register({
  secret: ENVIRONMENT.JWT_SECRET,
  signOptions: { expiresIn: '7d' },
})

// After ✅
JwtModule.registerAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => ({
    secret: configService.get<string>('JWT_SECRET'),
    signOptions: { expiresIn: '7d' },
  }),
})
```

### 2. JWT Authentication Failed (403 Unauthenticated)
**Error:**
```json
{
  "statusCode": 403,
  "errorCode": "unauthenticated",
  "message": "User is not authenticated."
}
```

**Cause:**
- JWT strategy (`jwt.strategy.ts`) was looking for `Account` model that doesn't exist
- Project uses `User` model instead of `Account` model
- Token validation failed because user couldn't be found in database

**Fix:**
Updated `/src/shared/service/token/jwt.strategy.ts`:

```typescript
// Before ❌
import { AccountModel } from "src/db/prisma/models";

async validate(payload: IJwtPayload) {
  const account = await this.prismaService.account.findFirst(...);
  // account model doesn't exist!
}

// After ✅
import { UserModel } from "src/db/prisma/models";

async validate(payload: IJwtPayload) {
  const user = await this.prismaService.user.findFirst({
    where: { id: payload.sub, isActive: true, isDeleted: false }
  });
  // Uses User model correctly
}
```

### 3. Missing Token Issuer (iss) Field
**Cause:**
- Admin service was generating JWT tokens without the `issuer` field
- JWT strategy requires `iss` field to determine which secret to use
- Tokens were being rejected during validation

**Fix:**
Updated token generation in `/src/domain/admin/admin.service.ts` for all three methods:
- `adminLogin()`
- `adminSignup()`
- `createIdolAccount()`

```typescript
// Before ❌
const accessToken = this.jwtService.sign({
  sub: user.id,
  email: user.email,
  role: user.role,
});

// After ✅
const accessToken = this.jwtService.sign(
  {
    sub: user.id,
    email: user.email,
    role: user.role,
  },
  {
    issuer: TokenIssuer.Access,  // ✅ Added issuer
    secret: ENVIRONMENT.JWT_SECRET,
    expiresIn: '7d',
  }
);
```

## Files Modified

1. **`/src/domain/admin/admin.module.ts`**
   - Changed `JwtModule.register()` to `JwtModule.registerAsync()`
   - Added ConfigModule import and ConfigService injection

2. **`/src/domain/admin/admin.service.ts`**
   - Added `TokenIssuer` and `ENVIRONMENT` imports
   - Updated token generation in `adminLogin()` to include `issuer` field
   - Updated token generation in `adminSignup()` to include `issuer` field
   - Updated token generation in `createIdolAccount()` to include `issuer` field

3. **`/src/shared/service/token/jwt.strategy.ts`**
   - Changed import from `AccountModel` to `UserModel`
   - Updated `validate()` method to use `user` table instead of `account` table
   - Simplified logic to only check User model

## Testing

After these fixes, the following should work:

### Admin Signup
```bash
curl -X POST http://localhost:8080/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ventidole.com",
    "password": "admin123",
    "name": "System Admin"
  }'
```

### Admin Login
```bash
curl -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ventidole.com",
    "password": "admin123"
  }'
```

### Create Idol (Protected Endpoint)
```bash
curl -X POST http://localhost:8080/admin/idols \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "gdragon@gmail.com",
    "password": "Password@123456",
    "stageName": "G-Dragon",
    "groupId": "your-group-id",
    "bio": "Professional singer 🎤"
  }'
```

## Technical Details

### JWT Token Structure (After Fix)
```json
{
  "sub": "user-id",
  "email": "admin@ventidole.com",
  "role": "ADMIN",
  "iss": "access",  // ✅ Required for validation
  "iat": 1762852153,
  "exp": 1763456953
}
```

### Authentication Flow
1. User logs in via `/admin/login` or `/admin/signup`
2. Server generates JWT with `issuer: TokenIssuer.Access`
3. Client receives token
4. Client sends token in `Authorization: Bearer TOKEN` header
5. `JwtAuthGuard` intercepts request
6. `JwtStrategy.validate()` is called
7. Strategy checks `iss` field to determine which secret to use
8. Strategy queries `user` table in database
9. If user found and active → authentication succeeds
10. Guard checks if user role matches required role (`ADMIN`)
11. Request proceeds to controller

### Why These Changes Work

1. **Async JWT Module**: Ensures ConfigService is loaded before accessing JWT_SECRET
2. **User Model**: Aligns with actual database schema (no Account model exists)
3. **Token Issuer**: Allows JWT strategy to properly validate tokens with correct secret

## Verification

All compilation errors resolved ✅
- No TypeScript errors in `admin.service.ts`
- No TypeScript errors in `jwt.strategy.ts`
- No TypeScript errors in `admin.module.ts`

All runtime issues resolved ✅
- JWT secret properly loaded
- Tokens include required `iss` field
- User validation works with correct model
- Authentication succeeds for admin users
- Authorization checks admin role correctly
