# JWT Authentication Fix

## Problem
Chat and File endpoints using `@UseGuards(JwtAuthGuard)` were failing with error:
```
Cannot read properties of undefined (reading 'id')
```

The issue occurred when accessing `request.user.id` in the chat service.

## Root Cause
Both `ChatModule` and `FileModule` were missing critical authentication configuration:

1. **Missing PassportModule import** - The Passport library needs to be registered with the 'jwt' strategy
2. **Missing JwtStrategy provider** - The strategy that validates JWT tokens wasn't provided
3. **Missing RedisService provider** - Required by JwtStrategy for caching
4. **Missing PrismaService provider** - Required by JwtStrategy for user lookup
5. **Static JWT configuration** - Using `JwtModule.register()` instead of `JwtModule.registerAsync()`

## Solution

### ChatModule Fix
```typescript
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@shared/service/token/jwt.strategy';
import { RedisService } from '@shared/service/redis/redis.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
    NotificationModule,
  ],
  providers: [
    ChatService,
    ChatGateway,
    PrismaService,
    FirebaseService,
    JwtStrategy,        // ← Added
    RedisService,       // ← Added
  ],
})
export class ChatModule {}
```

### FileModule Fix
```typescript
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from '@shared/service/token/jwt.strategy';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { RedisService } from '@shared/service/redis/redis.service';

@Module({
  imports: [
    FirebaseModule,
    PassportModule.register({ defaultStrategy: 'jwt' }),  // ← Added
    JwtModule.registerAsync({                              // ← Changed from register()
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
    }),
  ],
  providers: [
    FileService,
    JwtStrategy,    // ← Added
    PrismaService,  // ← Added
    RedisService,   // ← Added
  ],
})
export class FileModule {}
```

### Additional Error Handling
Added validation in `chat.service.ts`:
```typescript
async createChannel(body: CreateChannelRequest, request: IRequest) {
  // Validate request.user exists
  if (!request.user || !request.user.id) {
    this.logger.error('User not found in request', { user: request.user });
    throw new CustomError(ErrorCode.Unauthenticated);
  }

  const userId = request.user.id;
  // ... rest of the method
}
```

## How It Works

1. **PassportModule** registers the JWT strategy as the default authentication method
2. **JwtStrategy** (from `jwt.strategy.ts`) implements the token validation logic:
   - Extracts JWT from Bearer token
   - Validates signature using JWT_SECRET
   - Looks up user in database
   - Caches user in Redis
   - Returns `{ id: user.id, role: user.role }`
3. **JwtAuthGuard** (from Passport) calls the strategy's `validate()` method
4. The returned user object is attached to `request.user`
5. Controllers can now access `request.user.id` and `request.user.role`

## Testing

### 1. Rebuild and restart the server
```bash
# If using Docker
make build

# Or restart the service
make dev
```

### 2. Get a fresh JWT token
```bash
curl -X POST http://localhost:8080/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-admin@example.com",
    "password": "your-password"
  }'
```

### 3. Test chat channel creation
```bash
curl -X POST http://localhost:8080/chat/channels \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -d '{
    "name": "Test Announcement",
    "type": "ANNOUNCEMENT"
  }'
```

### 4. Test file upload (authenticated endpoint)
```bash
curl -X POST http://localhost:8080/file/upload \
  -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -F "file=@/path/to/your/file.jpg"
```

## Verification
After the fix, the following should work:
- ✅ JWT authentication on chat endpoints
- ✅ JWT authentication on file endpoints
- ✅ `request.user` properly populated with `{ id, role }`
- ✅ Role-based access control (if using `@Roles()` decorator)
- ✅ WebSocket authentication in ChatGateway

## Related Files
- `/src/domain/chat/chat.module.ts` - Fixed module configuration
- `/src/domain/file/file.module.ts` - Fixed module configuration
- `/src/domain/chat/chat.service.ts` - Added error handling
- `/src/shared/service/token/jwt.strategy.ts` - JWT validation logic
- `/src/core/guard/jwt-auth.guard.ts` - Passport JWT guard
- `/src/shared/interface/request.interface.ts` - TypeScript interface for authenticated requests

## Note
The same pattern should be applied to **any new module** that uses `@UseGuards(JwtAuthGuard)`:
1. Import `PassportModule.register({ defaultStrategy: 'jwt' })`
2. Import `JwtModule.registerAsync()` with ConfigService
3. Provide `JwtStrategy`, `PrismaService`, and `RedisService`
