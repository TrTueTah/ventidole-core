# User Chat API Documentation

## 📋 Overview

The User Chat API provides endpoints for users to interact with their chat channels and messages. This API is built on top of Stream Chat and follows the same patterns as your other user modules (post, community, comment).

---

## 🏗️ Module Structure

```
src/domain/user/chat/
├── dto/
│   ├── channel.dto.ts           # Channel response DTO
│   ├── message.dto.ts           # Message response DTO
│   ├── send-message.dto.ts      # Send message request DTO
│   └── get-messages.dto.ts      # Get messages query parameters
├── chat.controller.ts           # API endpoints
├── chat.service.ts              # Business logic
└── chat.module.ts               # Module definition
```

**Key Features:**
✅ Follows same pattern as post/community/comment modules
✅ All responses wrapped in `BaseResponse<T>`
✅ Uses `@ApiResponseCustom` decorators for Swagger
✅ DTOs with proper validation
✅ Automatic user authentication via JWT
✅ Error handling with custom error codes

---

## 🔑 API Endpoints

**Base URL:** `/v1/user/chat`
**Authentication:** All endpoints require JWT Bearer token

### 1. Get User's Chat Channels

Get all chat channels that the current user is a member of.

```http
GET /v1/user/chat/channels
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "id": "messaging:channel-123",
      "type": "messaging",
      "name": "General Discussion",
      "image": "https://example.com/channel.jpg",
      "memberIds": ["user_1", "user_2", "user_3"],
      "memberCount": 3,
      "lastMessage": {
        "id": "msg_123",
        "text": "Hello everyone!",
        "createdAt": "2024-01-01T00:00:00.000Z",
        "user": {
          "id": "user_1",
          "name": "John Doe"
        }
      },
      "unreadCount": 5,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T12:00:00.000Z"
    }
  ],
  "error": null,
  "errorCode": null
}
```

### 2. Get Channel Messages

Get messages from a specific channel with pagination support.

```http
GET /v1/user/chat/channels/:channelId/messages?limit=50&messageId=msg_123
Authorization: Bearer <jwt-token>
```

**Path Parameters:**
- `channelId` (string, required): Channel ID in format `type:id` (e.g., `messaging:channel-123`)

**Query Parameters:**
- `limit` (number, optional): Number of messages to retrieve (1-100, default: 50)
- `messageId` (string, optional): Message ID to start from (for pagination)

**Response:**
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "id": "msg_123",
      "text": "Hello, how are you?",
      "user": {
        "id": "user_123",
        "name": "John Doe",
        "image": "https://example.com/avatar.jpg"
      },
      "attachments": [
        {
          "type": "image",
          "image_url": "https://example.com/image.jpg",
          "file_size": 1024,
          "mime_type": "image/jpeg"
        }
      ],
      "reactions": {
        "like": ["user_1", "user_2"],
        "love": ["user_3"]
      },
      "parentId": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "error": null,
  "errorCode": null
}
```

### 3. Send Message

Send a message to a channel.

```http
POST /v1/user/chat/channels/:channelId/messages
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "text": "Hello everyone!",
  "parentId": "msg_parent_123"  // optional, for threaded replies
}
```

**Path Parameters:**
- `channelId` (string, required): Channel ID in format `type:id`

**Request Body:**
```typescript
{
  text: string;        // Required: Message text content
  parentId?: string;   // Optional: Parent message ID for threaded replies
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "id": "msg_new_123",
    "text": "Hello everyone!",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "image": "https://example.com/avatar.jpg"
    },
    "attachments": [],
    "reactions": {},
    "parentId": null,
    "createdAt": "2024-01-01T12:00:00.000Z",
    "updatedAt": "2024-01-01T12:00:00.000Z"
  },
  "error": null,
  "errorCode": null
}
```

---

## 🚨 Error Codes

The API uses custom error codes for better error handling:

| Error Code | Description |
|------------|-------------|
| `ChatChannelRetrievalFailed` | Failed to retrieve channels from Stream Chat |
| `ChatMessageRetrievalFailed` | Failed to retrieve messages from a channel |
| `ChatMessageSendFailed` | Failed to send message to channel |
| `ChatChannelAccessDenied` | User is not a member of the channel |
| `InvalidChannelId` | Channel ID format is invalid |

**Error Response Example:**
```json
{
  "statusCode": 403,
  "message": "Forbidden",
  "data": null,
  "error": {
    "message": "You do not have access to this channel"
  },
  "errorCode": "ChatChannelAccessDenied"
}
```

---

## 📱 React Native Integration Examples

### 1. Get User's Channels

```typescript
const getChannels = async (jwtToken: string) => {
  const response = await fetch('https://api.com/v1/user/chat/channels', {
    headers: {
      'Authorization': `Bearer ${jwtToken}`,
    },
  });

  const result = await response.json();
  return result.data; // Array of ChannelDto
};
```

### 2. Get Channel Messages

```typescript
const getMessages = async (
  channelId: string,
  jwtToken: string,
  limit: number = 50
) => {
  const response = await fetch(
    `https://api.com/v1/user/chat/channels/${channelId}/messages?limit=${limit}`,
    {
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
      },
    }
  );

  const result = await response.json();
  return result.data; // Array of MessageDto
};
```

### 3. Send Message

```typescript
const sendMessage = async (
  channelId: string,
  text: string,
  jwtToken: string,
  parentId?: string
) => {
  const response = await fetch(
    `https://api.com/v1/user/chat/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${jwtToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text, parentId }),
    }
  );

  const result = await response.json();
  return result.data; // MessageDto
};
```

### 4. Complete Chat Service Example

```typescript
// services/chatService.ts
import axios from 'axios';

const API_BASE_URL = 'https://your-api.com/v1';

export const chatService = {
  // Get all channels for user
  async getChannels(jwtToken: string) {
    const response = await axios.get(`${API_BASE_URL}/user/chat/channels`, {
      headers: { Authorization: `Bearer ${jwtToken}` },
    });
    return response.data.data;
  },

  // Get messages from a channel
  async getMessages(
    channelId: string,
    jwtToken: string,
    options?: { limit?: number; messageId?: string }
  ) {
    const params = new URLSearchParams();
    if (options?.limit) params.append('limit', options.limit.toString());
    if (options?.messageId) params.append('messageId', options.messageId);

    const response = await axios.get(
      `${API_BASE_URL}/user/chat/channels/${channelId}/messages?${params}`,
      {
        headers: { Authorization: `Bearer ${jwtToken}` },
      }
    );
    return response.data.data;
  },

  // Send a message
  async sendMessage(
    channelId: string,
    text: string,
    jwtToken: string,
    parentId?: string
  ) {
    const response = await axios.post(
      `${API_BASE_URL}/user/chat/channels/${channelId}/messages`,
      { text, parentId },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
          'Content-Type': 'application/json',
        },
      }
    );
    return response.data.data;
  },
};
```

### 5. React Native Hook Example

```typescript
// hooks/useChat.ts
import { useState, useEffect } from 'react';
import { chatService } from '../services/chatService';

export const useChat = (jwtToken: string) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadChannels = async () => {
      try {
        setLoading(true);
        const data = await chatService.getChannels(jwtToken);
        setChannels(data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadChannels();
  }, [jwtToken]);

  const sendMessage = async (channelId: string, text: string) => {
    try {
      const message = await chatService.sendMessage(
        channelId,
        text,
        jwtToken
      );
      return message;
    } catch (err) {
      setError(err);
      throw err;
    }
  };

  return { channels, loading, error, sendMessage };
};
```

---

## 🔄 Workflow Examples

### Workflow 1: Display Channel List

```typescript
// screens/ChannelListScreen.tsx
import React from 'react';
import { FlatList, Text, TouchableOpacity } from 'react-native';
import { useChat } from '../hooks/useChat';

export const ChannelListScreen = ({ jwtToken, navigation }) => {
  const { channels, loading } = useChat(jwtToken);

  if (loading) return <LoadingIndicator />;

  return (
    <FlatList
      data={channels}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => navigation.navigate('Chat', { channelId: item.id })}
        >
          <View>
            <Text>{item.name || 'Direct Message'}</Text>
            <Text>{item.lastMessage?.text}</Text>
            {item.unreadCount > 0 && (
              <Badge count={item.unreadCount} />
            )}
          </View>
        </TouchableOpacity>
      )}
    />
  );
};
```

### Workflow 2: Chat Screen with Messages

```typescript
// screens/ChatScreen.tsx
import React, { useState, useEffect } from 'react';
import { FlatList, TextInput, Button } from 'react-native';
import { chatService } from '../services/chatService';

export const ChatScreen = ({ route, jwtToken }) => {
  const { channelId } = route.params;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    loadMessages();
  }, [channelId]);

  const loadMessages = async () => {
    const data = await chatService.getMessages(channelId, jwtToken);
    setMessages(data.reverse()); // Reverse to show oldest first
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMessage = await chatService.sendMessage(
      channelId,
      inputText,
      jwtToken
    );

    setMessages([...messages, newMessage]);
    setInputText('');
  };

  return (
    <View>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} />
        )}
      />
      <View>
        <TextInput
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
        />
        <Button title="Send" onPress={handleSend} />
      </View>
    </View>
  );
};
```

### Workflow 3: Load More Messages (Pagination)

```typescript
const loadMoreMessages = async () => {
  if (messages.length === 0) return;

  const oldestMessage = messages[0];
  const olderMessages = await chatService.getMessages(
    channelId,
    jwtToken,
    { limit: 50, messageId: oldestMessage.id }
  );

  setMessages([...olderMessages.reverse(), ...messages]);
};
```

---

## 🔒 Security Notes

1. **Authentication**: All endpoints require JWT authentication
2. **Authorization**: Users can only access channels they are members of
3. **User ID**: Automatically extracted from JWT token (from `req.user.id`)
4. **Channel Access**: Service validates channel membership before operations
5. **Error Handling**: Custom error codes for better client-side handling

---

## 📊 Comparison with Stream Chat Admin API

| Feature | User Chat API (`/user/chat`) | Stream Chat Admin API (`/stream-chat`) |
|---------|------------------------------|----------------------------------------|
| **Purpose** | User-facing chat operations | Admin/setup operations |
| **Path** | `/v1/user/chat` | `/v1/stream-chat` |
| **User ID** | Extracted from JWT | Provided in request |
| **Use Case** | Mobile app chat features | User management, token generation |
| **Endpoints** | Get channels, messages, send | Create users, channels, tokens |
| **Authorization** | Channel membership | JWT validation only |

**When to use User Chat API:**
- ✅ Display user's channel list
- ✅ Load and display messages
- ✅ Send messages from mobile app
- ✅ Implement chat UI in React Native

**When to use Stream Chat Admin API:**
- ✅ Generate Stream Chat tokens
- ✅ Create users on signup
- ✅ Create channels programmatically
- ✅ Admin operations

---

## ✅ Benefits of This API

1. **Consistent with Your Codebase**: Follows same patterns as post/community/comment
2. **Type-Safe**: Full TypeScript DTOs with validation
3. **User-Friendly**: Simple REST endpoints for common chat operations
4. **Secure**: JWT authentication + channel access validation
5. **Well-Documented**: Swagger documentation auto-generated
6. **Error Handling**: Custom error codes for better UX
7. **Optimized**: Direct integration with Stream Chat SDK
8. **Maintainable**: Clean separation of concerns

---

## 🚀 Quick Start Checklist

### Backend (Already Done ✅)
- [x] Chat module created
- [x] DTOs defined
- [x] Service implemented
- [x] Controller created
- [x] Module registered
- [x] Error codes added
- [x] Build successful

### Frontend (React Native Todo)
- [ ] Create chat service wrapper
- [ ] Implement channel list screen
- [ ] Implement chat/message screen
- [ ] Add message pagination
- [ ] Handle errors gracefully
- [ ] Add loading states
- [ ] Test with real users

---

**Last Updated:** December 8, 2025
**Status:** ✅ Production Ready
