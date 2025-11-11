# Admin Domain Documentation

## Overview
The Admin domain provides administrative endpoints for managing the Ventidole platform. This includes creating idol accounts, managing users, and viewing platform statistics.

## Features

### 1. **Idol Account Management**
- Create new idol accounts with user credentials
- Generated JWT tokens for immediate login
- Automatic User + Idol profile creation

### 2. **User Management**
- View all users, idols, and fans
- Activate/deactivate accounts
- Soft delete users

### 3. **Platform Statistics**
- Total users, fans, idols, groups
- Online users count

## Security
- **All endpoints require ADMIN role**
- Protected by JWT authentication
- Uses `@Roles(Role.ADMIN)` decorator

## API Endpoints

### POST /admin/idols
Create a new idol account (Admin only)

**Request Body:**
```json
{
  "email": "idol@example.com",
  "password": "Password@123456",
  "stageName": "Luna Star",
  "groupId": "group-id-123",
  "avatarUrl": "https://storage.googleapis.com/bucket/avatars/idol-123.jpg",
  "backgroundUrl": "https://storage.googleapis.com/bucket/backgrounds/idol-123.jpg",
  "bio": "Professional singer and performer 🎤✨",
  "deviceToken": "FCM_DEVICE_TOKEN_HERE"
}
```

**Response:**
```json
{
  "code": 0,
  "data": {
    "userId": "user-id-123",
    "email": "idol@example.com",
    "role": "IDOL",
    "idol": {
      "id": "idol-id-123",
      "stageName": "Luna Star",
      "avatarUrl": "https://...",
      "backgroundUrl": "https://...",
      "bio": "Professional singer and performer 🎤✨",
      "groupId": "group-id-123",
      "userId": "user-id-123",
      "createdAt": "2025-11-11T10:00:00.000Z",
      "updatedAt": "2025-11-11T10:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### GET /admin/idols
Get all idols with their profiles

**Response:**
```json
{
  "code": 0,
  "data": [
    {
      "id": "idol-id-123",
      "stageName": "Luna Star",
      "groupId": "group-id-123",
      "user": {
        "id": "user-id-123",
        "email": "idol@example.com",
        "role": "IDOL",
        "isOnline": true,
        "isActive": true,
        "createdAt": "2025-11-11T10:00:00.000Z"
      },
      "group": {
        "id": "group-id-123",
        "name": "StarLight",
        "avatarUrl": "https://..."
      }
    }
  ]
}
```

### GET /admin/fans
Get all fans with their profiles

### GET /admin/users
Get all users with their associated profiles (fan or idol)

### GET /admin/statistics
Get platform statistics

**Response:**
```json
{
  "code": 0,
  "data": {
    "totalUsers": 1500,
    "totalFans": 1200,
    "totalIdols": 300,
    "totalGroups": 50,
    "onlineUsers": 450
  }
}
```

### PATCH /admin/users/:userId/activate
Activate a user account

### PATCH /admin/users/:userId/deactivate
Deactivate a user account

### DELETE /admin/users/:userId
Soft delete a user account

## Architecture

### Module Structure
```
src/domain/admin/
├── admin.module.ts          # Module definition with JWT
├── admin.controller.ts      # REST endpoints (all @Roles(ADMIN))
├── admin.service.ts         # Business logic
├── request/
│   ├── create-idol.request.ts
│   └── index.request.ts
└── response/
    ├── create-idol.response.ts
    └── index.response.ts
```

### Service Layer
- **PrismaService**: Database operations
- **JwtService**: Token generation for new idol accounts
- **bcrypt**: Password hashing

### Password Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter
- At least one number
- At least one special character

## Validation

### CreateIdolRequest
- `email`: Valid email format, lowercase
- `password`: Matches password regex (see above)
- `stageName`: Required, max 100 chars
- `groupId`: Required, must exist in database
- `avatarUrl`: Optional, max 255 chars
- `backgroundUrl`: Optional, max 255 chars
- `bio`: Optional, max 500 chars
- `deviceToken`: Optional, max 255 chars

## Error Handling

### EmailAlreadyExists
- Code: (defined in ErrorCode enum)
- Scenario: When trying to create idol with existing email

### ValidationFailed
- Code: (defined in ErrorCode enum)
- Scenario: When groupId doesn't exist

### AccountNotFound
- Code: (defined in ErrorCode enum)
- Scenario: When trying to manage non-existent user

## Usage Examples

### Creating an Idol Account
```typescript
// Admin makes request
POST /admin/idols
Authorization: Bearer ADMIN_JWT_TOKEN

{
  "email": "newstar@example.com",
  "password": "SecurePass@123",
  "stageName": "New Star",
  "groupId": "existing-group-id",
  "bio": "Rising star in K-pop 🌟"
}

// Response includes tokens that can be given to the idol
// Idol can immediately login with email/password
```

### Viewing Platform Stats
```typescript
GET /admin/statistics
Authorization: Bearer ADMIN_JWT_TOKEN

// Returns overview of platform health
```

## Integration Points

### With Auth Domain
- Admin must be authenticated with ADMIN role
- Uses same JWT configuration
- Shares guard mechanisms

### With User Domain
- Creates User records with hashed passwords
- Links to Idol profile creation
- Maintains referential integrity

### With Chat Domain
- New idols can create announcement channels
- Idol accounts are ready for real-time messaging

## Best Practices

1. **Security First**: Never expose admin endpoints publicly
2. **Audit Trail**: Consider logging all admin actions
3. **Token Management**: Securely deliver tokens to new idols
4. **Validation**: Always verify groupId exists before creating idol
5. **Soft Deletes**: Use soft delete to maintain data integrity

## Future Enhancements

- [ ] Admin action audit logs
- [ ] Bulk user operations
- [ ] Advanced filtering and search
- [ ] Admin dashboard analytics
- [ ] Role-based admin permissions (super admin, moderator)
- [ ] User suspension with duration
- [ ] Content moderation tools
