# Admin Authentication Documentation

## Overview
Admin authentication endpoints that **bypass all verification requirements**. These endpoints allow admins to signup and login instantly without email verification or any other checks.

## Security Notice
⚠️ **WARNING**: These endpoints create and authenticate admin accounts without any verification. In production:
- Consider restricting admin signup to internal networks only
- Add additional security layers (IP whitelisting, invite codes, etc.)
- Monitor admin account creation closely
- Implement audit logging for all admin actions

## Endpoints

### POST /admin/signup
Create a new admin account instantly (bypass all verification)

**Public Endpoint** - No authentication required

**Request Body:**
```json
{
  "email": "admin@ventidole.com",
  "password": "admin123",
  "name": "Admin Name"
}
```

**Validation:**
- `email`: Valid email format, unique, converted to lowercase
- `password`: Minimum 6 characters
- `name`: Required string

**Response:**
```json
{
  "code": 0,
  "data": {
    "userId": "usr_abc123",
    "email": "admin@ventidole.com",
    "role": "ADMIN",
    "name": "Admin Name",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Features:**
- ✅ No email verification required
- ✅ Account instantly active
- ✅ Returns JWT tokens immediately
- ✅ Password hashed with bcrypt
- ✅ Role automatically set to ADMIN

**Error Responses:**
- `EmailAlreadyExists`: Email is already registered

---

### POST /admin/login
Admin login with email and password

**Public Endpoint** - No authentication required

**Request Body:**
```json
{
  "email": "admin@ventidole.com",
  "password": "admin123"
}
```

**Validation:**
- `email`: Valid email format, converted to lowercase
- `password`: Minimum 6 characters

**Response:**
```json
{
  "code": 0,
  "data": {
    "userId": "usr_abc123",
    "email": "admin@ventidole.com",
    "role": "ADMIN",
    "name": "Admin",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Features:**
- ✅ Verifies ADMIN role specifically
- ✅ Password verification with bcrypt
- ✅ Auto-activates account if not active
- ✅ Returns fresh JWT tokens

**Error Responses:**
- `InvalidEmailOrPassword`: Wrong credentials or user is not an admin

---

## Implementation Details

### Password Security
- **Hashing**: bcrypt with salt rounds (10)
- **Minimum Length**: 6 characters
- **Storage**: Never stored in plain text

### JWT Tokens
- **Access Token**: 7 days expiry
- **Refresh Token**: 30 days expiry
- **Payload**: `{ sub: userId, email, role }`

### Role Verification
- Login endpoint specifically checks for `Role.ADMIN`
- Non-admin users cannot login through this endpoint
- Ensures separation between admin and regular user authentication

### Account Activation
- Signup: Account created as `isActive: true`
- Login: Activates account if `isActive: false` (auto-recovery)

## Usage Examples

### Creating First Admin
```bash
curl -X POST http://localhost:3000/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ventidole.com",
    "password": "securepass123",
    "name": "System Admin"
  }'
```

**Response:**
```json
{
  "code": 0,
  "data": {
    "userId": "clxx123abc",
    "email": "admin@ventidole.com",
    "role": "ADMIN",
    "name": "System Admin",
    "accessToken": "eyJhbG...",
    "refreshToken": "eyJhbG..."
  }
}
```

### Admin Login
```bash
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ventidole.com",
    "password": "securepass123"
  }'
```

### Using Admin Token
```bash
curl -X GET http://localhost:3000/admin/statistics \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## Architecture

### Bypass Strategy
Unlike regular user authentication (`/auth/signup`, `/auth/login`) which requires email verification:

**Regular User Flow:**
1. POST /auth/signup → Creates user as `isActive: false`
2. Send verification email
3. POST /auth/verify → Activates account
4. POST /auth/login → Can login

**Admin Flow (Bypassed):**
1. POST /admin/signup → Creates user as `isActive: true` ✅
2. Immediately get tokens ✅
3. Can use admin endpoints immediately ✅

### Security Model
- **Public Signup**: No auth required (⚠️ risk in production)
- **Public Login**: No auth required (standard)
- **Protected Endpoints**: Require `@Roles(ADMIN)` decorator

### Database Changes
Admin accounts use the same `User` model with:
- `role: Role.ADMIN`
- `isActive: true` (set immediately)
- `isDeleted: false`
- No `fan` or `idol` relationship

## Testing

### Test Admin Signup
```typescript
describe('Admin Signup', () => {
  it('should create admin account instantly', async () => {
    const response = await request(app.getHttpServer())
      .post('/admin/signup')
      .send({
        email: 'testadmin@example.com',
        password: 'test123',
        name: 'Test Admin'
      })
      .expect(201);

    expect(response.body.data.role).toBe('ADMIN');
    expect(response.body.data.accessToken).toBeDefined();
  });
});
```

### Test Admin Login
```typescript
describe('Admin Login', () => {
  it('should login with valid credentials', async () => {
    // First create admin
    await createTestAdmin();
    
    // Then login
    const response = await request(app.getHttpServer())
      .post('/admin/login')
      .send({
        email: 'testadmin@example.com',
        password: 'test123'
      })
      .expect(200);

    expect(response.body.data.accessToken).toBeDefined();
  });

  it('should reject non-admin users', async () => {
    // Create regular user
    await createTestUser({ role: 'FAN' });
    
    // Try to login as admin
    await request(app.getHttpServer())
      .post('/admin/login')
      .send({
        email: 'fan@example.com',
        password: 'test123'
      })
      .expect(401); // InvalidEmailOrPassword
  });
});
```

## Security Recommendations

### Development
- ✅ Use simple passwords for testing
- ✅ Create multiple test admin accounts
- ✅ Public signup endpoint is convenient

### Staging
- ⚠️ Consider IP whitelisting for signup
- ⚠️ Monitor admin account creation
- ⚠️ Use strong passwords

### Production
- 🔒 **CRITICAL**: Disable public admin signup
- 🔒 Require invite codes or admin approval
- 🔒 IP whitelist admin signup endpoint
- 🔒 Enable 2FA for admin accounts
- 🔒 Audit log all admin authentication
- 🔒 Rate limit login attempts
- 🔒 Alert on new admin account creation

### Hardening Options

#### Option 1: Invite Code
```typescript
// Add to AdminSignupRequest
@ApiProperty({ example: 'INVITE-CODE-123' })
inviteCode: string;

// Validate in service
const validCode = await this.prisma.inviteCode.findUnique({
  where: { code: body.inviteCode, used: false }
});
if (!validCode) throw new CustomError(ErrorCode.InvalidInviteCode);
```

#### Option 2: Environment-based Toggle
```typescript
// In admin.controller.ts
if (ENVIRONMENT.ENABLE_ADMIN_SIGNUP !== 'true') {
  throw new CustomError(ErrorCode.FeatureDisabled);
}
```

#### Option 3: IP Whitelist
```typescript
// In admin.controller.ts
const clientIp = request.ip;
const allowedIps = ENVIRONMENT.ADMIN_ALLOWED_IPS.split(',');
if (!allowedIps.includes(clientIp)) {
  throw new CustomError(ErrorCode.Forbidden);
}
```

## Comparison with Regular Auth

| Feature | Admin Auth | Regular Auth |
|---------|-----------|--------------|
| Signup Endpoint | `/admin/signup` | `/auth/signup` |
| Email Verification | ❌ Bypassed | ✅ Required |
| Account Active | ✅ Immediately | ❌ After verification |
| Can Login After Signup | ✅ Yes | ❌ Not until verified |
| Returns Tokens | ✅ Yes | ❌ Not until login |
| Role | ADMIN | FAN (default) |
| Has Profile | ❌ No fan/idol | ✅ Fan profile created |

## Future Enhancements

- [ ] Add 2FA for admin login
- [ ] Implement invite code system
- [ ] Add IP whitelisting middleware
- [ ] Session management (logout, invalidate tokens)
- [ ] Admin activity audit logs
- [ ] Password complexity requirements for admins
- [ ] Account recovery flow for admins
- [ ] Rate limiting on auth endpoints
- [ ] Brute force protection
- [ ] Email notification on admin login
