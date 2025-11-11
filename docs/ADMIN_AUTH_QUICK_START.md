# Admin Authentication Quick Start

## 🚀 Getting Started

### 1. Create Your First Admin Account
```bash
curl -X POST http://localhost:3000/admin/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ventidole.com",
    "password": "admin123",
    "name": "System Admin"
  }'
```

✅ **Account created instantly - no email verification needed!**

**Response:**
```json
{
  "code": 0,
  "data": {
    "userId": "clxx123abc",
    "email": "admin@ventidole.com",
    "role": "ADMIN",
    "name": "System Admin",
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### 2. Login as Admin
```bash
curl -X POST http://localhost:3000/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ventidole.com",
    "password": "admin123"
  }'
```

### 3. Use Admin Token to Create Idols
```bash
curl -X POST http://localhost:3000/admin/idols \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "luna@starlight.com",
    "password": "LunaPass@123",
    "stageName": "Luna Star",
    "groupId": "your-group-id",
    "bio": "Main vocalist 🎤✨"
  }'
```

### 4. Check Platform Statistics
```bash
curl -X GET http://localhost:3000/admin/statistics \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

## 📋 Complete Endpoint List

### Public Endpoints (No Auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/signup` | Create admin account (bypass verification) |
| POST | `/admin/login` | Admin login |

### Protected Endpoints (Requires Admin Token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/admin/idols` | Create idol account |
| GET | `/admin/idols` | Get all idols |
| GET | `/admin/fans` | Get all fans |
| GET | `/admin/users` | Get all users |
| GET | `/admin/statistics` | Platform statistics |
| PATCH | `/admin/users/:userId/activate` | Activate user |
| PATCH | `/admin/users/:userId/deactivate` | Deactivate user |
| DELETE | `/admin/users/:userId` | Delete user (soft) |

## 🔑 Key Features

### Bypass All Verification ✅
- **No email verification** required
- **Instantly active** account
- **Immediate JWT tokens** returned
- Perfect for development and testing

### Admin-Specific Login 🔒
- Only users with `Role.ADMIN` can login via `/admin/login`
- Regular users (FAN/IDOL) cannot access admin endpoints
- Clear separation of authentication flows

### Simple Password Requirements
- Minimum 6 characters (for admin auth)
- Minimum 8 characters with complexity (for idol creation)
- All passwords hashed with bcrypt

## ⚠️ Security Warning

**Development**: Public admin signup is convenient for testing ✅

**Production**: 
- 🔒 **DISABLE** public admin signup
- 🔒 Require invite codes
- 🔒 IP whitelist the signup endpoint
- 🔒 Enable 2FA
- 🔒 Monitor admin account creation

See `/docs/ADMIN_AUTH.md` for hardening recommendations.

## 🔄 Comparison: Admin vs Regular User

| Feature | Admin Auth | Regular Auth |
|---------|-----------|--------------|
| Signup | `/admin/signup` | `/auth/signup` |
| Verification | ❌ Bypassed | ✅ Email required |
| Active Status | ✅ Immediate | ❌ After verify |
| Tokens on Signup | ✅ Yes | ❌ Only on login |
| Min Password | 6 chars | 8 chars + complexity |

## 📚 Documentation

- **Full Admin Auth Docs**: `/docs/ADMIN_AUTH.md`
- **Admin Domain Overview**: `/docs/ADMIN_DOMAIN.md`
- **Implementation Details**: `/docs/ADMIN_IMPLEMENTATION_SUMMARY.md`

## 🧪 Testing

```typescript
// Test admin signup
const signupRes = await request(app)
  .post('/admin/signup')
  .send({
    email: 'test@admin.com',
    password: 'test123',
    name: 'Test Admin'
  });

expect(signupRes.body.data.role).toBe('ADMIN');
expect(signupRes.body.data.accessToken).toBeDefined();

// Test admin login
const loginRes = await request(app)
  .post('/admin/login')
  .send({
    email: 'test@admin.com',
    password: 'test123'
  });

expect(loginRes.body.data.accessToken).toBeDefined();

// Use token for protected endpoint
await request(app)
  .get('/admin/statistics')
  .set('Authorization', `Bearer ${loginRes.body.data.accessToken}`)
  .expect(200);
```

## 🎯 Use Cases

### Development
- Quickly create admin accounts for testing
- No need to verify emails
- Fast iteration

### Demo/Staging
- Easy admin account setup
- Test admin workflows
- Showcase admin features

### Production
- **First-time setup only** (create initial admin)
- Then disable public signup
- Use admin panel to create additional admins

## 💡 Tips

1. **Save your tokens**: Access token lasts 7 days, refresh token 30 days
2. **Use environment variables**: Store admin credentials securely
3. **Monitor logs**: Watch for unauthorized admin creation attempts
4. **Regular rotation**: Change admin passwords periodically
5. **Audit trail**: Log all admin actions for compliance
