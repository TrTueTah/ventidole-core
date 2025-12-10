# Stream Chat - React Native Integration Guide

## 📱 Overview

This guide explains how to integrate Ventidole's Stream Chat backend with your React Native mobile application.

---

## 🏗️ Backend Architecture

### Module Structure
```
src/domain/stream-chat/
├── dto/                              # Data Transfer Objects
│   ├── generate-token.dto.ts        # Token generation request
│   ├── create-user.dto.ts           # User creation/update
│   ├── create-channel.dto.ts        # Channel creation
│   ├── manage-members.dto.ts        # Add/remove members
│   ├── send-message.dto.ts          # Send message
│   ├── token.dto.ts                 # Token response
│   ├── user.dto.ts                  # User response
│   └── channel.dto.ts               # Channel response
├── stream-chat.controller.ts        # API endpoints
├── stream-chat.service.ts           # Business logic
└── stream-chat.module.ts            # NestJS module
```

### Response Format
All endpoints return a standardized `BaseResponse` format:

```typescript
{
  "statusCode": 200,
  "message": "OK",
  "data": { /* actual data */ },
  "error": null,
  "errorCode": null
}
```

---

## 🔑 API Endpoints

**Base URL:** `https://your-api.com/v1/stream-chat`

**Authentication:** All endpoints require Bearer token (JWT) in headers

### 1. Generate Stream Chat Token
**Required before connecting to Stream Chat**

```http
POST /stream-chat/token
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "userId": "user_123"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "apiKey": "4ka5qffvkyde",
    "userId": "user_123"
  },
  "error": null,
  "errorCode": null
}
```

### 2. Create/Update User in Stream Chat
**Call this after user signup or profile updates**

```http
POST /stream-chat/users
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "userId": "user_123",
  "name": "John Doe",
  "image": "https://example.com/avatar.jpg",
  "role": "user"
}
```

### 3. Get User's Channels

```http
GET /stream-chat/channels/:userId
Authorization: Bearer <your-jwt-token>
```

### 4. Create Channel

```http
POST /stream-chat/channels
Authorization: Bearer <your-jwt-token>
Content-Type: application/json

{
  "type": "messaging",
  "channelId": "general-chat",  // optional, auto-generated if not provided
  "members": ["user_1", "user_2"],
  "name": "General Discussion",
  "description": "A place for general discussion"
}
```

### 5. Manage Channel Members

**Add Members:**
```http
POST /stream-chat/channels/:channelType/:channelId/members
Content-Type: application/json

{
  "memberIds": ["user_3", "user_4"]
}
```

**Remove Members:**
```http
DELETE /stream-chat/channels/:channelType/:channelId/members
Content-Type: application/json

{
  "memberIds": ["user_3", "user_4"]
}
```

### 6. Send Message

```http
POST /stream-chat/channels/:channelType/:channelId/messages
Content-Type: application/json

{
  "userId": "user_123",
  "text": "Hello, World!"
}
```

### 7. Get Messages

```http
GET /stream-chat/channels/:channelType/:channelId/messages?limit=50
```

### 8. Delete Channel

```http
DELETE /stream-chat/channels/:channelType/:channelId
```

### 9. Delete User

```http
DELETE /stream-chat/users/:userId
```

---

## 📲 React Native Integration

### Step 1: Install Dependencies

```bash
npm install stream-chat-react-native
# or
yarn add stream-chat-react-native

# Install peer dependencies
npm install @react-native-community/netinfo react-native-gesture-handler react-native-get-random-values react-native-reanimated react-native-safe-area-context react-native-svg
```

### Step 2: Create Chat Service

Create a service to handle API calls:

```typescript
// services/streamChatService.ts
import axios from 'axios';

const API_BASE_URL = 'https://your-api.com/v1';

export const streamChatService = {
  // Get Stream Chat token from your backend
  async getStreamToken(userId: string, jwtToken: string) {
    const response = await axios.post(
      `${API_BASE_URL}/stream-chat/token`,
      { userId },
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data; // { token, apiKey, userId }
  },

  // Create/update user in Stream Chat
  async createStreamUser(userData: {
    userId: string;
    name: string;
    image?: string;
    role?: string;
  }, jwtToken: string) {
    const response = await axios.post(
      `${API_BASE_URL}/stream-chat/users`,
      userData,
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data;
  },

  // Create a new channel
  async createChannel(channelData: {
    type: string;
    members: string[];
    name?: string;
    description?: string;
  }, jwtToken: string) {
    const response = await axios.post(
      `${API_BASE_URL}/stream-chat/channels`,
      channelData,
      {
        headers: {
          'Authorization': `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data.data;
  },
};
```

### Step 3: Initialize Stream Chat Client

```typescript
// hooks/useStreamChat.ts
import { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { streamChatService } from '../services/streamChatService';

export const useStreamChat = (currentUser: any, jwtToken: string) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const initChat = async () => {
      try {
        // 1. Get Stream Chat token from your backend
        const { token, apiKey } = await streamChatService.getStreamToken(
          currentUser.id,
          jwtToken
        );

        // 2. Initialize Stream Chat client
        const client = StreamChat.getInstance(apiKey);

        // 3. Connect user to Stream Chat
        await client.connectUser(
          {
            id: currentUser.id,
            name: currentUser.name,
            image: currentUser.avatarUrl,
          },
          token
        );

        setChatClient(client);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to initialize Stream Chat:', error);
      }
    };

    if (currentUser && jwtToken) {
      initChat();
    }

    // Cleanup on unmount
    return () => {
      if (chatClient) {
        chatClient.disconnectUser();
      }
    };
  }, [currentUser, jwtToken]);

  return { chatClient, isReady };
};
```

### Step 4: Implement Chat UI

```typescript
// screens/ChatScreen.tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import { Chat, OverlayProvider, ChannelList, Channel, MessageList, MessageInput } from 'stream-chat-react-native';
import { useStreamChat } from '../hooks/useStreamChat';

export const ChatScreen = ({ currentUser, jwtToken }) => {
  const { chatClient, isReady } = useStreamChat(currentUser, jwtToken);

  if (!isReady || !chatClient) {
    return <LoadingScreen />;
  }

  const filters = {
    members: { $in: [currentUser.id] },
    type: 'messaging',
  };

  const sort = { last_message_at: -1 };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <OverlayProvider>
        <Chat client={chatClient}>
          <ChannelList
            filters={filters}
            sort={sort}
            onSelect={(channel) => {
              // Navigate to channel screen
            }}
          />
        </Chat>
      </OverlayProvider>
    </SafeAreaView>
  );
};
```

### Step 5: Channel Screen

```typescript
// screens/ChannelScreen.tsx
import React from 'react';
import { SafeAreaView } from 'react-native';
import { Chat, Channel, MessageList, MessageInput } from 'stream-chat-react-native';

export const ChannelScreen = ({ chatClient, channelId }) => {
  const channel = chatClient.channel('messaging', channelId);

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Chat client={chatClient}>
        <Channel channel={channel}>
          <MessageList />
          <MessageInput />
        </Channel>
      </Chat>
    </SafeAreaView>
  );
};
```

---

## 🔄 Common Workflows

### 1. User Signup Flow

```typescript
async function handleUserSignup(userData) {
  // 1. Register user in your backend
  const response = await authService.signup(userData);
  const { user, jwtToken } = response.data;

  // 2. Create user in Stream Chat
  await streamChatService.createStreamUser(
    {
      userId: user.id,
      name: user.name,
      image: user.avatarUrl,
      role: 'user',
    },
    jwtToken
  );

  // 3. Get Stream Chat token
  const streamAuth = await streamChatService.getStreamToken(
    user.id,
    jwtToken
  );

  // 4. Connect to Stream Chat
  const chatClient = StreamChat.getInstance(streamAuth.apiKey);
  await chatClient.connectUser(
    {
      id: user.id,
      name: user.name,
      image: user.avatarUrl,
    },
    streamAuth.token
  );
}
```

### 2. Create Direct Message Channel

```typescript
async function createDirectMessage(currentUserId, targetUserId, jwtToken) {
  const channelData = {
    type: 'messaging',
    members: [currentUserId, targetUserId],
  };

  const channel = await streamChatService.createChannel(
    channelData,
    jwtToken
  );

  return channel;
}
```

### 3. Create Group Channel

```typescript
async function createGroupChannel(
  memberIds: string[],
  groupName: string,
  jwtToken: string
) {
  const channelData = {
    type: 'messaging',
    members: memberIds,
    name: groupName,
    description: `Group chat for ${groupName}`,
  };

  const channel = await streamChatService.createChannel(
    channelData,
    jwtToken
  );

  return channel;
}
```

### 4. Add Members to Existing Channel

```typescript
// Client-side using Stream Chat SDK (recommended)
const channel = chatClient.channel('messaging', 'channel-id');
await channel.addMembers(['user_3', 'user_4']);

// Or via backend API
await axios.post(
  `${API_BASE_URL}/stream-chat/channels/messaging/channel-id/members`,
  { memberIds: ['user_3', 'user_4'] },
  { headers: { Authorization: `Bearer ${jwtToken}` } }
);
```

---

## 🔒 Authentication Flow

```
┌─────────────┐      ┌──────────────────┐      ┌─────────────┐
│             │      │                  │      │             │
│   Mobile    │─────▶│  Your Backend    │─────▶│ Stream Chat │
│     App     │  (1) │   (NestJS API)   │  (2) │   Servers   │
│             │◀─────│                  │◀─────│             │
└─────────────┘  (3) └──────────────────┘  (2) └─────────────┘
       │                                              ▲
       │                                              │
       └──────────────────────────────────────────────┘
                           (4)
```

1. **User logs in** → Your backend validates credentials → Returns JWT token
2. **App requests Stream token** → Backend validates JWT → Generates Stream token
3. **Backend returns** Stream token + API key to app
4. **App connects** to Stream Chat using token

---

## 🎨 Customization Examples

### Custom Theme

```typescript
import { defaultTheme } from 'stream-chat-react-native';

const customTheme = {
  ...defaultTheme,
  colors: {
    ...defaultTheme.colors,
    primary: '#FF6B6B',
    secondary: '#4ECDC4',
  },
  messageSimple: {
    content: {
      textContainer: {
        borderRadius: 12,
      },
    },
  },
};

<Chat client={chatClient} style={customTheme}>
  {/* ... */}
</Chat>
```

### Custom Message Renderer

```typescript
const CustomMessage = (props) => {
  return (
    <View style={styles.customMessage}>
      <Text>{props.message.text}</Text>
      <Text style={styles.timestamp}>
        {new Date(props.message.created_at).toLocaleTimeString()}
      </Text>
    </View>
  );
};

<MessageList Message={CustomMessage} />
```

---

## 🐛 Troubleshooting

### Issue: "Token is invalid"
**Solution:**
- Ensure you're calling `/stream-chat/token` endpoint with valid JWT
- Check that `STREAM_CHAT_SECRET` is set correctly in backend `.env`
- Verify user exists in Stream Chat (call `/stream-chat/users` first)

### Issue: "Cannot connect to Stream Chat"
**Solution:**
- Check network connectivity
- Verify API key is correct
- Ensure token hasn't expired
- Check Stream Chat dashboard for service status

### Issue: "Channel not found"
**Solution:**
- Ensure channel was created successfully
- Verify channel ID is correct
- Check that user is a member of the channel

### Issue: Messages not appearing
**Solution:**
- Check WebSocket connection status
- Verify user has permission to read messages
- Ensure channel is properly watched
- Check for errors in console logs

---

## 📊 Best Practices

### 1. **Token Management**
```typescript
// Store tokens securely
import AsyncStorage from '@react-native-async-storage/async-storage';

// Save tokens
await AsyncStorage.setItem('jwt_token', jwtToken);
await AsyncStorage.setItem('stream_token', streamToken);

// Retrieve tokens
const jwtToken = await AsyncStorage.getItem('jwt_token');
const streamToken = await AsyncStorage.getItem('stream_token');
```

### 2. **Error Handling**
```typescript
try {
  await chatClient.connectUser(userData, token);
} catch (error) {
  if (error.message.includes('token')) {
    // Refresh token
    const newToken = await refreshStreamToken();
    await chatClient.connectUser(userData, newToken);
  } else {
    // Handle other errors
    console.error('Chat connection error:', error);
  }
}
```

### 3. **Offline Support**
```typescript
// Stream Chat SDK handles offline automatically
// Messages are queued and sent when back online

// You can check connection status:
chatClient.on('connection.changed', (event) => {
  console.log('Connection status:', event.online ? 'Online' : 'Offline');
});
```

### 4. **Performance Optimization**
```typescript
// Limit initial channel list
const filters = {
  members: { $in: [currentUser.id] },
  type: 'messaging',
};

const options = {
  limit: 20,  // Load 20 channels at a time
  message_limit: 25,  // Load 25 messages per channel
};

<ChannelList
  filters={filters}
  options={options}
  // Enable pagination
  loadMoreThreshold={0.3}
/>
```

---

## 📚 Resources

### Documentation
- [Stream Chat React Native Docs](https://getstream.io/chat/docs/sdk/react-native/)
- [Stream Chat REST API](https://getstream.io/chat/docs/rest/)
- [Your Backend API Documentation](https://your-api.com/docs)

### Example Apps
- [Stream Chat React Native Example](https://github.com/GetStream/stream-chat-react-native)
- [Slack Clone Tutorial](https://getstream.io/chat/react-native-chat/tutorial/)

### Support
- Stream Chat Support: https://getstream.io/chat/support/
- Backend Issues: Create issue in your repo

---

## ✅ Checklist for Implementation

- [ ] Install `stream-chat-react-native` package
- [ ] Set up authentication with your backend
- [ ] Create `streamChatService` for API calls
- [ ] Implement `useStreamChat` hook
- [ ] Create channel list screen
- [ ] Create channel/message screen
- [ ] Handle user signup/login flow
- [ ] Implement error handling
- [ ] Add offline support
- [ ] Test direct messaging
- [ ] Test group channels
- [ ] Customize UI to match your brand
- [ ] Add push notifications (optional)
- [ ] Implement message reactions (optional)
- [ ] Add file/image sharing (optional)

---

**Last Updated:** December 8, 2025
**Status:** ✅ Production Ready
