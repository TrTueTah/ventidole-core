# Stream Chat Integration - Quick Summary

## 📋 Overview

Your Ventidole backend now has a complete Stream Chat integration following the same patterns as your other modules (post, community, comment). This enables real-time messaging functionality for your React Native mobile app.

---

## 🏗️ Backend Structure

```
src/domain/stream-chat/
├── dto/                       # All DTOs in one folder (Request + Response)
│   ├── generate-token.dto.ts
│   ├── create-user.dto.ts
│   ├── create-channel.dto.ts
│   ├── manage-members.dto.ts
│   ├── send-message.dto.ts
│   ├── token.dto.ts
│   ├── user.dto.ts
│   └── channel.dto.ts
├── stream-chat.controller.ts  # REST API endpoints
├── stream-chat.service.ts     # Business logic
└── stream-chat.module.ts      # Module definition
```

**Key Features:**
✅ Follows same pattern as post/community/comment modules
✅ All responses wrapped in `BaseResponse<T>`
✅ Uses `@ApiResponseCustom` decorators for Swagger
✅ DTOs with proper validation
✅ Lazy initialization to prevent environment variable errors

---

## 🔑 Environment Variables Required

Add to your `.env` file:

```env
STREAM_CHAT_API_KEY=4ka5qffvkyde
STREAM_CHAT_SECRET=wtwm5k3kmemwgvv7b8vwpmzpuubpn3v68bwbuazxnhaevb6cxwan4qzk9datwks7
```

---

## 📡 API Endpoints Overview

**Base URL:** `/v1/stream-chat`
**Authentication:** All endpoints require JWT Bearer token

### Core Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/token` | POST | Generate Stream Chat token for client |
| `/users` | POST | Create/update user in Stream Chat |
| `/users/:userId` | DELETE | Delete user |
| `/channels` | POST | Create new channel |
| `/channels/:userId` | GET | Get user's channels |
| `/channels/:type/:id` | DELETE | Delete channel |
| `/channels/:type/:id/members` | POST | Add members |
| `/channels/:type/:id/members` | DELETE | Remove members |
| `/channels/:type/:id/messages` | POST | Send message |
| `/channels/:type/:id/messages` | GET | Get messages |

### Response Format

All endpoints return:
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": { /* actual data */ },
  "error": null,
  "errorCode": null
}
```

---

## 📱 React Native Integration Flow

### 1. **Initial Setup (One-time)**

```typescript
// Install package
npm install stream-chat-react-native

// Or with Expo
expo install stream-chat-react-native
```

### 2. **User Login Flow**

```typescript
// Step 1: User logs in to your backend
const authResponse = await fetch('https://api.com/v1/auth/sign-in', {
  method: 'POST',
  body: JSON.stringify({ email, password }),
});
const { jwtToken, user } = await authResponse.json();

// Step 2: Get Stream Chat token from your backend
const streamResponse = await fetch('https://api.com/v1/stream-chat/token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ userId: user.id }),
});
const { data } = await streamResponse.json();
const { token, apiKey } = data;

// Step 3: Connect to Stream Chat
import { StreamChat } from 'stream-chat';

const chatClient = StreamChat.getInstance(apiKey);
await chatClient.connectUser(
  {
    id: user.id,
    name: user.name,
    image: user.avatarUrl,
  },
  token
);
```

### 3. **Display Chat UI**

```typescript
import { Chat, ChannelList, Channel, MessageList, MessageInput } from 'stream-chat-react-native';

function ChatScreen() {
  return (
    <Chat client={chatClient}>
      <ChannelList
        filters={{ members: { $in: [currentUserId] } }}
        sort={{ last_message_at: -1 }}
      />
    </Chat>
  );
}
```

---

## 🔄 Common Use Cases

### Use Case 1: Create Direct Message

```typescript
// Option A: Via your backend API
await fetch('https://api.com/v1/stream-chat/channels', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${jwtToken}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    type: 'messaging',
    members: [currentUserId, targetUserId],
  }),
});

// Option B: Directly via Stream Chat SDK (recommended for mobile)
const channel = chatClient.channel('messaging', {
  members: [currentUserId, targetUserId],
});
await channel.watch();
```

### Use Case 2: Create Group Chat

```typescript
const channel = chatClient.channel('messaging', {
  members: ['user1', 'user2', 'user3'],
  name: 'Team Discussion',
});
await channel.create();
```

### Use Case 3: Send Message

```typescript
// Messages are sent via Stream Chat SDK
const channel = chatClient.channel('messaging', 'channel-id');
await channel.sendMessage({
  text: 'Hello everyone!',
});
```

---

## 🔐 Security Architecture

```
┌──────────────┐
│ React Native │
│     App      │
└──────┬───────┘
       │ (1) Login
       ▼
┌──────────────┐
│   Backend    │
│   (NestJS)   │ ──(2) Validate & Generate──┐
└──────┬───────┘                            │
       │ (3) Return token                   ▼
       │                            ┌────────────────┐
       │                            │  Stream Chat   │
       └────────────(4)─────────────▶    Servers     │
              Connect with token    └────────────────┘
```

**Key Points:**
- Never expose `STREAM_CHAT_SECRET` to clients
- Backend validates JWT before generating Stream tokens
- Clients only receive Stream Chat tokens, not secrets
- All backend endpoints protected with JWT auth

---

## 🎯 When to Call Backend vs Stream SDK

### Call Your Backend API When:
✅ Generating initial Stream Chat token (required)
✅ Creating users on signup
✅ Server-side channel creation with custom logic
✅ Admin operations (ban users, delete channels)
✅ Syncing data with your database

### Use Stream SDK Directly When:
✅ Sending/receiving messages (real-time)
✅ Creating channels during chat flow
✅ Reacting to messages
✅ Uploading images/files
✅ Typing indicators
✅ Read receipts
✅ Watching channels

---

## 🛠️ Code Example: Complete Hook

```typescript
// hooks/useStreamChat.ts
import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';

export function useStreamChat(user, jwtToken) {
  const [client, setClient] = useState(null);

  useEffect(() => {
    const initChat = async () => {
      try {
        // Get Stream token from your backend
        const res = await fetch('https://api.com/v1/stream-chat/token', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${jwtToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ userId: user.id }),
        });

        const { data } = await res.json();

        // Initialize Stream Chat
        const chatClient = StreamChat.getInstance(data.apiKey);
        await chatClient.connectUser(
          {
            id: user.id,
            name: user.name,
            image: user.avatarUrl,
          },
          data.token
        );

        setClient(chatClient);
      } catch (error) {
        console.error('Stream Chat init failed:', error);
      }
    };

    initChat();

    return () => {
      client?.disconnectUser();
    };
  }, [user, jwtToken]);

  return client;
}
```

---

## 📚 Documentation Links

- **React Native Guide:** [STREAM_CHAT_REACT_NATIVE_GUIDE.md](./STREAM_CHAT_REACT_NATIVE_GUIDE.md)
- **Full Implementation Details:** [STREAM_CHAT_IMPLEMENTATION.md](./STREAM_CHAT_IMPLEMENTATION.md)
- **Stream Chat Docs:** https://getstream.io/chat/docs/sdk/react-native/
- **API Documentation:** https://your-api.com/docs (Swagger)

---

## ✅ Quick Checklist

### Backend (Already Done ✅)
- [x] Environment variables configured
- [x] Stream Chat module created
- [x] API endpoints implemented
- [x] DTOs with validation
- [x] Swagger documentation
- [x] Build successful

### React Native (Todo)
- [ ] Install `stream-chat-react-native`
- [ ] Create `useStreamChat` hook
- [ ] Implement login flow with token generation
- [ ] Create channel list screen
- [ ] Create chat/message screen
- [ ] Handle errors and offline state
- [ ] Customize UI theme
- [ ] Test direct messages
- [ ] Test group chats
- [ ] Deploy to production

---

## 💡 Key Takeaways

1. **Backend is Ready**: All endpoints are implemented and follow your project's patterns
2. **Lazy Initialization**: Stream Chat client initializes only when needed (prevents env errors)
3. **Standard Response**: All endpoints return `BaseResponse<T>` like your other modules
4. **Security First**: All endpoints require JWT authentication
5. **Client-Side SDK**: Most chat operations should use Stream SDK directly (faster, real-time)
6. **Backend for Auth**: Only use backend API for token generation and admin operations

---

**Last Updated:** December 8, 2025
**Status:** ✅ Backend Complete | 📱 Ready for React Native Integration
