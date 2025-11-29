# Stream Chat - Quick Start Guide

## ✅ Implementation Complete

Stream Chat has been successfully integrated into your Ventidole backend!

## What Was Implemented

### 1. Backend Infrastructure

- ✅ **Stream Chat Service** - Core service for token generation and user management
- ✅ **REST API Endpoints** - Two secure endpoints for mobile app integration
- ✅ **Automatic User Creation** - Users are created in Stream Chat during signup
- ✅ **Security** - JWT authentication required for all endpoints

### 2. API Endpoints

**Base URL**: `http://localhost:8080/v1/stream-chat`

1. `POST /token` - Generate authentication token
2. `POST /user` - Create/update user profile

### 3. Files Created

```
src/domain/stream-chat/
├── request/
│   ├── generate-token.request.ts
│   └── create-user.request.ts
├── response/
│   ├── token.response.ts
│   └── user.response.ts
├── stream-chat.controller.ts
├── stream-chat.service.ts
└── stream-chat.module.ts
```

### 4. Environment Configuration

Added to `.env`:
```env
STREAM_CHAT_API_KEY=sy25rkkujgdv
STREAM_CHAT_SECRET=4ydqusj3kfcw3g9w8zsf8cbug8bcwcxswqmm8rnt2qwhmvt32ryu2jxa67ubdeyc
```

## Quick Test

### 1. Start the Server
```bash
npm run start:dev
```

### 2. Sign Up a User
```bash
curl -X POST http://localhost:8080/v1/auth/sign-up \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "username": "testuser"
  }'
```

### 3. Get Stream Chat Token
```bash
curl -X POST http://localhost:8080/v1/stream-chat/token \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN_FROM_SIGNUP>" \
  -d '{"userId": "<USER_ID_FROM_SIGNUP>"}'
```

## Mobile App Integration (React Native)

### Install Stream Chat SDK
```bash
npm install stream-chat-react-native
```

### Connect to Stream Chat
```typescript
import { StreamChat } from 'stream-chat';
import { Chat, OverlayProvider } from 'stream-chat-react-native';

// 1. Authenticate with your backend
const authResponse = await fetch('http://your-api/v1/auth/sign-in', {
  method: 'POST',
  body: JSON.stringify({ email, password })
});
const { accessToken, id } = await authResponse.json();

// 2. Get Stream Chat token
const streamResponse = await fetch('http://your-api/v1/stream-chat/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${accessToken}`
  },
  body: JSON.stringify({ userId: id })
});
const { token, apiKey } = await streamResponse.json();

// 3. Connect to Stream Chat
const client = StreamChat.getInstance(apiKey);
await client.connectUser(
  { id, name: username, image: avatarUrl },
  token
);

// 4. Use in your app
function App() {
  return (
    <OverlayProvider>
      <Chat client={client}>
        {/* Your chat UI here */}
      </Chat>
    </OverlayProvider>
  );
}
```

## What Happens Automatically

1. **User Signup** → Stream Chat user is created automatically
2. **Authentication** → Backend validates JWT tokens
3. **Token Generation** → Secure server-side token creation
4. **User Updates** → Can sync profile changes to Stream Chat

## Next Steps

1. **Test the endpoints** using the curl commands above
2. **Review the full documentation**: [STREAM_CHAT_INTEGRATION.md](./STREAM_CHAT_INTEGRATION.md)
3. **Integrate in your mobile app** using the React Native example
4. **Configure for production** by updating environment variables

## Important Security Notes

⚠️ **For Production**:
- Update `STREAM_CHAT_API_KEY` and `STREAM_CHAT_SECRET` in production environment
- Never commit production credentials to version control
- Use separate Stream Chat apps for development and production

## Resources

- 📚 [Full Integration Guide](./STREAM_CHAT_INTEGRATION.md)
- 🔗 [Stream Chat Documentation](https://getstream.io/chat/docs/)
- 🎮 [Stream Chat Dashboard](https://dashboard.getstream.io/)
- 📱 [React Native SDK Docs](https://getstream.io/chat/docs/sdk/reactnative/)

## Support

If you encounter any issues:
1. Check the [troubleshooting section](./STREAM_CHAT_INTEGRATION.md#troubleshooting)
2. Review application logs
3. Verify environment variables are set correctly
