# Stream Chat Integration Guide

## Overview

Stream Chat has been successfully integrated into the Ventidole backend to provide real-time messaging infrastructure for the mobile application. This integration provides secure token generation and user management for Stream Chat services.

## Architecture

### Components

1. **StreamChatModule** - Main module that provides Stream Chat functionality
   - Location: [src/domain/stream-chat/stream-chat.module.ts](../src/domain/stream-chat/stream-chat.module.ts)

2. **StreamChatService** - Service handling all Stream Chat operations
   - Location: [src/domain/stream-chat/stream-chat.service.ts](../src/domain/stream-chat/stream-chat.service.ts)

3. **StreamChatController** - REST API endpoints for Stream Chat
   - Location: [src/domain/stream-chat/stream-chat.controller.ts](../src/domain/stream-chat/stream-chat.controller.ts)

### Integration Points

- **User Signup**: Stream Chat users are automatically created when users sign up
  - Location: [src/domain/auth/auth.service.ts](../src/domain/auth/auth.service.ts:82-92)
  - Non-blocking: Signup succeeds even if Stream Chat user creation fails

## Configuration

### Environment Variables

Add these variables to your `.env` file:

```env
STREAM_CHAT_API_KEY=sy25rkkujgdv
STREAM_CHAT_SECRET=4ydqusj3kfcw3g9w8zsf8cbug8bcwcxswqmm8rnt2qwhmvt32ryu2jxa67ubdeyc
```

**Security Note**:
- For production, store these credentials securely using environment variables
- Never commit production credentials to version control
- Update `.env.example` with placeholder values

## API Endpoints

All endpoints require Bearer token authentication via `Authorization: Bearer <token>` header.

### 1. Generate Stream Chat Token

**Endpoint**: `POST /v1/stream-chat/token`

**Description**: Generates a Stream Chat authentication token for the authenticated user.

**Request Headers**:
```
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "string"
}
```

**Response** (200 OK):
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "apiKey": "sy25rkkujgdv",
    "userId": "user123"
  },
  "error": null,
  "errorCode": null
}
```

**Error Responses**:
- `400 Bad Request`: Missing or invalid userId
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: Token generation failed

### 2. Create/Update Stream Chat User

**Endpoint**: `POST /v1/stream-chat/user`

**Description**: Creates or updates a user profile in Stream Chat. This should be called after user registration or when profile information changes.

**Request Headers**:
```
Authorization: Bearer <your-access-token>
Content-Type: application/json
```

**Request Body**:
```json
{
  "userId": "string",
  "name": "John Doe",
  "image": "https://example.com/avatar.jpg"  // optional
}
```

**Response** (200 OK):
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "success": true,
    "message": "User created/updated successfully",
    "userId": "user123"
  },
  "error": null,
  "errorCode": null
}
```

**Error Responses**:
- `400 Bad Request`: Missing required fields (userId or name)
- `401 Unauthorized`: Invalid or missing authentication token
- `500 Internal Server Error`: User creation/update failed

## Mobile App Integration

### Step 1: User Authentication

First, authenticate with your backend to get an access token:

```typescript
const authResponse = await fetch(`${API_URL}/v1/auth/sign-in`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123'
  })
});

const { data } = await authResponse.json();
const accessToken = data.accessToken;
```

### Step 2: Get Stream Chat Token

Request a Stream Chat token from the backend:

```typescript
const streamResponse = await fetch(`${API_URL}/v1/stream-chat/token`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    userId: data.id
  })
});

const streamData = await streamResponse.json();
const { token, apiKey, userId } = streamData.data;
```

### Step 3: Initialize Stream Chat Client

Use the token to connect to Stream Chat:

```typescript
import { StreamChat } from 'stream-chat';

// Initialize the Stream Chat client
const chatClient = StreamChat.getInstance(apiKey);

// Connect the user
await chatClient.connectUser(
  {
    id: userId,
    name: userName,
    image: userImage,
  },
  token
);

console.log('Connected to Stream Chat!');
```

### Step 4: Update User Profile (Optional)

When a user updates their profile, sync the changes to Stream Chat:

```typescript
const updateResponse = await fetch(`${API_URL}/v1/stream-chat/user`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({
    userId: currentUser.id,
    name: currentUser.name,
    image: currentUser.profileImage
  })
});
```

## Features

### Implemented Features

✅ Token Generation - Secure server-side token generation
✅ User Creation - Automatic user creation during signup
✅ User Updates - Update user profile information
✅ User Deactivation - Temporarily disable users
✅ User Reactivation - Re-enable deactivated users
✅ User Deletion - Soft delete users from Stream Chat

### Automatic User Creation

When a user signs up through the `/v1/auth/sign-up` endpoint, a Stream Chat user is automatically created with:
- **User ID**: The user's database ID
- **Name**: The user's username or email
- **Image**: The user's avatar URL (if available)

This is a non-blocking operation - if Stream Chat user creation fails, the signup will still succeed, and the error will be logged.

## Service Methods

The `StreamChatService` provides these methods:

### generateToken(userId: string)
Generates an authentication token for a user.

```typescript
const result = await streamChatService.generateToken('user-id-123');
// Returns: { token, apiKey, userId }
```

### createOrUpdateUser(userId: string, name: string, image?: string)
Creates or updates a user in Stream Chat.

```typescript
await streamChatService.createOrUpdateUser(
  'user-id-123',
  'John Doe',
  'https://example.com/avatar.jpg'
);
```

### deleteUser(userId: string)
Soft deletes a user from Stream Chat.

```typescript
await streamChatService.deleteUser('user-id-123');
```

### deactivateUser(userId: string)
Temporarily deactivates a user.

```typescript
await streamChatService.deactivateUser('user-id-123');
```

### reactivateUser(userId: string)
Reactivates a previously deactivated user.

```typescript
await streamChatService.reactivateUser('user-id-123');
```

### getClient()
Returns the Stream Chat client instance for advanced operations.

```typescript
const client = streamChatService.getClient();
// Use client for advanced Stream Chat operations
```

## Security Considerations

1. **Server-Side Token Generation**: Tokens are generated server-side using the secret key, which is never exposed to clients

2. **Authentication Required**: All endpoints require valid JWT authentication

3. **User ID Validation**: The system uses the authenticated user's ID from the JWT token, preventing users from generating tokens for other users

4. **Token Expiration**: Stream Chat tokens have automatic expiration (configurable)

5. **Environment Variables**: Sensitive credentials are stored in environment variables

## Testing

### Using cURL

#### Generate Token
```bash
curl -X POST http://localhost:8080/v1/stream-chat/token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{"userId": "user123"}'
```

#### Create/Update User
```bash
curl -X POST http://localhost:8080/v1/stream-chat/user \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "userId": "user123",
    "name": "John Doe",
    "image": "https://example.com/avatar.jpg"
  }'
```

### Using Postman

1. Import the OpenAPI specification from `openapi.yaml`
2. Set the `Authorization` header with your Bearer token
3. Test the endpoints under the "Stream Chat" collection

## Troubleshooting

### Token Generation Fails

**Symptoms**: 500 error when generating tokens

**Solutions**:
- Verify `STREAM_CHAT_API_KEY` and `STREAM_CHAT_SECRET` are set correctly in `.env`
- Check that the Stream Chat app is active in the [Stream Chat dashboard](https://dashboard.getstream.io/)
- Ensure the userId is a valid string

### User Creation Fails

**Symptoms**: 500 error when creating/updating users

**Solutions**:
- Verify the userId format is correct (alphanumeric, `-` and `_` allowed)
- Check Stream Chat dashboard for quota limits
- Ensure the app has necessary permissions
- Check application logs for detailed error messages

### User Not Found in Stream Chat

**Symptoms**: User exists in database but not in Stream Chat

**Solutions**:
- Call the `/v1/stream-chat/user` endpoint to create the user
- Check application logs for errors during signup
- Verify Stream Chat credentials are correct

## Resources

- [Stream Chat Documentation](https://getstream.io/chat/docs/)
- [Stream Chat Dashboard](https://dashboard.getstream.io/app/1447568/chat/overview)
- [Stream Chat Node.js SDK](https://github.com/GetStream/stream-chat-js)
- [Stream Chat React Native SDK](https://getstream.io/chat/docs/sdk/reactnative/)

## Future Improvements

Potential enhancements for the Stream Chat integration:

1. **Rate Limiting**: Add rate limiting to token generation endpoint
2. **Token Refresh**: Implement automatic token refresh mechanism
3. **Webhooks**: Add webhook handlers for Stream Chat events
4. **Channel Management**: Implement channel creation and management endpoints
5. **Moderation**: Add moderation features (ban users, delete messages)
6. **Analytics**: Track chat usage and metrics
7. **Push Notifications**: Integrate with existing notification system
8. **File Uploads**: Handle file/image uploads in chat
9. **Typing Indicators**: Implement typing indicators
10. **Read Receipts**: Track message read status

## Migration Guide

If you need to migrate existing users to Stream Chat:

1. Create a migration script:
```typescript
// scripts/migrate-users-to-stream-chat.ts
import { PrismaClient } from '@prisma/client';
import { StreamChatService } from '../src/domain/stream-chat/stream-chat.service';

const prisma = new PrismaClient();

async function migrateUsers() {
  const users = await prisma.user.findMany({
    where: { isActive: true, isDeleted: false }
  });

  for (const user of users) {
    try {
      await streamChatService.createOrUpdateUser(
        user.id,
        user.username || user.email,
        user.avatarUrl
      );
      console.log(`Migrated user: ${user.id}`);
    } catch (error) {
      console.error(`Failed to migrate user ${user.id}:`, error);
    }
  }
}

migrateUsers();
```

2. Run the migration:
```bash
npx tsx scripts/migrate-users-to-stream-chat.ts
```

## Support

For issues or questions:
- Check the [troubleshooting section](#troubleshooting)
- Review Stream Chat documentation
- Check application logs for detailed error messages
- Contact the development team
