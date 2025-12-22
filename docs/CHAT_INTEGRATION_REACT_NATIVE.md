# Chat Integration Guide for React Native

This guide explains how to integrate the Ventidole chat system into your React Native application.

## Overview

The chat system uses a hybrid approach:
- **Database**: All chat data (channels, messages, participants) is stored in the backend database
- **GetStream**: Used for real-time message delivery and synchronization

## Table of Contents

1. [Installation](#installation)
2. [Authentication](#authentication)
3. [API Endpoints](#api-endpoints)
4. [GetStream Integration](#getstream-integration)
5. [Implementation Examples](#implementation-examples)
6. [Best Practices](#best-practices)

---

## Installation

### Required Packages

```bash
npm install stream-chat-react-native
npm install @stream-io/flat-list-mvcp
npm install react-native-svg
npm install react-native-gesture-handler
npm install react-native-reanimated
npm install @react-native-camera-roll/camera-roll
npm install react-native-image-picker
```

### iOS Setup

```bash
cd ios && pod install && cd ..
```

---

## Authentication

All API requests require a Bearer token in the Authorization header:

```typescript
const API_URL = 'https://your-api.com/api/v1';

const headers = {
  'Authorization': `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
};
```

---

## API Endpoints

### 1. Get My Channels (Idol Only)

Get channels owned by the current user (for idols) including personal and community channels.

**Endpoint:** `GET /user/chat/my-channels`

**Authorization:** Required (Idol role)

**Response:**
```typescript
{
  "data": [
    {
      "id": "channel_123",
      "type": "messaging",
      "name": "Community General Chat",
      "image": "Channel description or image URL",
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
      "unreadCount": 0,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

**Example:**
```typescript
const getMyChannels = async (token: string) => {
  const response = await fetch(`${API_URL}/user/chat/my-channels`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

---

### 2. Get Joined Channels

Get all channels that the current user has joined as a participant.

**Endpoint:** `GET /user/chat/joined-channels`

**Authorization:** Required

**Response:** Same structure as My Channels

**Example:**
```typescript
const getJoinedChannels = async (token: string) => {
  const response = await fetch(`${API_URL}/user/chat/joined-channels`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

---

### 3. Get Channel Messages

Get messages from a specific channel with pagination support.

**Endpoint:** `GET /user/chat/channels/:channelId/messages`

**Authorization:** Required

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Number of messages per page (default: 20)

**Response:**
```typescript
{
  "data": [
    {
      "id": "msg_123",
      "text": "Hello!",
      "user": {
        "id": "user_123",
        "name": "John Doe",
        "image": "https://example.com/avatar.jpg"
      },
      "attachments": undefined,
      "reactions": undefined,
      "parentId": undefined,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "paging": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "totalPages": 8
  }
}
```

**Example:**
```typescript
const getChannelMessages = async (
  token: string,
  channelId: string,
  page: number = 1,
  limit: number = 20
) => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
  });

  const response = await fetch(
    `${API_URL}/user/chat/channels/${channelId}/messages?${params}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};
```

---

### 4. Mark Channel as Read

Mark all messages in a channel as read for the current user.

**Endpoint:** `POST /user/chat/channels/:channelId/read`

**Authorization:** Required

**Response:**
```typescript
{
  "statusCode": 200,
  "message": "Success",
  "data": null
}
```

**Example:**
```typescript
const markChannelAsRead = async (
  token: string,
  channelId: string
) => {
  const response = await fetch(
    `${API_URL}/user/chat/channels/${channelId}/read`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  return response.json();
};
```

---

### 5. Send Message

Send a message to a channel.

**Endpoint:** `POST /user/chat/channels/:channelId/messages`

**Authorization:** Required

**Request Body:**
```typescript
{
  "text": "Hello everyone!",
  "parentId": "msg_123" // Optional, for thread replies
}
```

**Response:**
```typescript
{
  "data": {
    "id": "msg_456",
    "text": "Hello everyone!",
    "user": {
      "id": "user_123",
      "name": "John Doe",
      "image": "https://example.com/avatar.jpg"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

**Example:**
```typescript
const sendMessage = async (
  token: string,
  channelId: string,
  text: string,
  parentId?: string
) => {
  const response = await fetch(
    `${API_URL}/user/chat/channels/${channelId}/messages`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        ...(parentId && { parentId }),
      }),
    }
  );
  return response.json();
};
```

---

### 6. Create Community Channel (Admin Only)

Create a chat channel for a community and add all idols as participants.

**Endpoint:** `POST /admin/chat/community-channel`

**Authorization:** Required (Admin role)

**Request Body:**
```typescript
{
  "communityId": "community_123",
  "name": "Community General Chat",
  "description": "A place for all community idols to chat"
}
```

**Response:**
```typescript
{
  "data": {
    "id": "channel_123",
    "name": "Community General Chat",
    "description": "A place for all community idols to chat",
    "communityId": "community_123",
    "participants": [
      {
        "id": "participant_1",
        "userId": "user_1",
        "canSendMessage": true,
        "user": {
          "id": "user_1",
          "username": "idol1",
          "avatarUrl": "https://example.com/avatar1.jpg"
        }
      }
    ],
    "community": {
      "id": "community_123",
      "name": "K-Pop Stars"
    }
  }
}
```

**Example:**
```typescript
const createCommunityChannel = async (
  token: string,
  communityId: string,
  name: string,
  description?: string
) => {
  const response = await fetch(`${API_URL}/admin/chat/community-channel`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      communityId,
      name,
      description,
    }),
  });
  return response.json();
};
```

---

## GetStream Integration

### 1. Get Stream Chat Token

First, get the Stream Chat token from your backend:

**Endpoint:** `POST /stream-chat/token`

```typescript
const getStreamToken = async (token: string) => {
  const response = await fetch(`${API_URL}/stream-chat/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  return response.json();
};
```

**Response:**
```typescript
{
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "apiKey": "your-stream-api-key",
    "userId": "user_123"
  }
}
```

### 2. Initialize Stream Chat Client

```typescript
import { StreamChat } from 'stream-chat';

const initStreamChat = async (userId: string, token: string, streamToken: string, apiKey: string) => {
  const chatClient = StreamChat.getInstance(apiKey);

  await chatClient.connectUser(
    {
      id: userId,
      name: 'User Name',
      image: 'https://example.com/avatar.jpg',
    },
    streamToken
  );

  return chatClient;
};
```

### 3. Setup React Native Components

```typescript
import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  ChannelList,
} from 'stream-chat-react-native';

const ChatScreen = () => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    const setupChat = async () => {
      // Get your backend token
      const backendToken = await getAuthToken();

      // Get Stream token from your backend
      const streamData = await getStreamToken(backendToken);

      // Initialize Stream Chat
      const client = await initStreamChat(
        streamData.data.userId,
        backendToken,
        streamData.data.token,
        streamData.data.apiKey
      );

      setChatClient(client);
    };

    setupChat();

    return () => {
      chatClient?.disconnectUser();
    };
  }, []);

  if (!chatClient) {
    return <LoadingView />;
  }

  return (
    <Chat client={chatClient}>
      <ChannelList />
    </Chat>
  );
};
```

---

## Implementation Examples

### Complete Chat Integration

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { StreamChat } from 'stream-chat';
import {
  Chat,
  Channel,
  MessageList,
  MessageInput,
  ChannelList,
  useChannelPreviewDisplayName,
} from 'stream-chat-react-native';

// API Service
class ChatService {
  private baseUrl = 'https://your-api.com/api/v1';
  private token: string;

  constructor(token: string) {
    this.token = token;
  }

  async getMyChannels() {
    const response = await fetch(`${this.baseUrl}/user/chat/my-channels`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    });
    return response.json();
  }

  async getJoinedChannels() {
    const response = await fetch(`${this.baseUrl}/user/chat/joined-channels`, {
      headers: { 'Authorization': `Bearer ${this.token}` },
    });
    return response.json();
  }

  async getChannelMessages(channelId: string, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    const response = await fetch(
      `${this.baseUrl}/user/chat/channels/${channelId}/messages?${params}`,
      {
        headers: { 'Authorization': `Bearer ${this.token}` },
      }
    );
    return response.json();
  }

  async sendMessage(channelId: string, text: string, parentId?: string) {
    const response = await fetch(
      `${this.baseUrl}/user/chat/channels/${channelId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, ...(parentId && { parentId }) }),
      }
    );
    return response.json();
  }

  async markChannelAsRead(channelId: string) {
    const response = await fetch(
      `${this.baseUrl}/user/chat/channels/${channelId}/read`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.token}`,
        },
      }
    );
    return response.json();
  }

  async getStreamToken() {
    const response = await fetch(`${this.baseUrl}/stream-chat/token`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${this.token}` },
    });
    return response.json();
  }
}

// Main Chat Component
const ChatApp = ({ authToken, userId }: { authToken: string; userId: string }) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<any>(null);

  useEffect(() => {
    const initChat = async () => {
      const chatService = new ChatService(authToken);

      // Get Stream credentials
      const streamData = await chatService.getStreamToken();

      // Initialize Stream Chat client
      const client = StreamChat.getInstance(streamData.data.apiKey);

      await client.connectUser(
        {
          id: streamData.data.userId,
        },
        streamData.data.token
      );

      setChatClient(client);
    };

    initChat();

    return () => {
      chatClient?.disconnectUser();
    };
  }, [authToken, userId]);

  if (!chatClient) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading chat...</Text>
      </View>
    );
  }

  return (
    <Chat client={chatClient}>
      {selectedChannel ? (
        <Channel channel={selectedChannel}>
          <View style={{ flex: 1 }}>
            <MessageList />
            <MessageInput />
          </View>
        </Channel>
      ) : (
        <ChannelList
          onSelect={(channel) => setSelectedChannel(channel)}
          filters={{ members: { $in: [userId] } }}
          sort={{ last_message_at: -1 }}
        />
      )}
    </Chat>
  );
};

export default ChatApp;
```

### Custom Channel List

```typescript
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';

const CustomChannelList = ({ authToken, onChannelPress }) => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const chatService = new ChatService(authToken);

      // For idols: get my channels (personal + community)
      const myChannelsResponse = await chatService.getMyChannels();

      // For all users: get joined channels
      const joinedChannelsResponse = await chatService.getJoinedChannels();

      // Combine and deduplicate
      const allChannels = [
        ...myChannelsResponse.data,
        ...joinedChannelsResponse.data,
      ];

      const uniqueChannels = allChannels.filter(
        (channel, index, self) =>
          index === self.findIndex((c) => c.id === channel.id)
      );

      setChannels(uniqueChannels);
    } catch (error) {
      console.error('Error loading channels:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderChannelItem = ({ item }) => (
    <TouchableOpacity
      style={styles.channelItem}
      onPress={() => onChannelPress(item)}
    >
      <View style={styles.channelInfo}>
        <Text style={styles.channelName}>{item.name || 'Unnamed Channel'}</Text>
        {item.lastMessage && (
          <Text style={styles.lastMessage} numberOfLines={1}>
            {item.lastMessage.text}
          </Text>
        )}
      </View>
      {item.unreadCount > 0 && (
        <View style={styles.unreadBadge}>
          <Text style={styles.unreadText}>{item.unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  if (loading) {
    return <Text>Loading channels...</Text>;
  }

  return (
    <FlatList
      data={channels}
      renderItem={renderChannelItem}
      keyExtractor={(item) => item.id}
      refreshing={loading}
      onRefresh={loadChannels}
    />
  );
};

const styles = StyleSheet.create({
  channelItem: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    alignItems: 'center',
  },
  channelInfo: {
    flex: 1,
  },
  channelName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  lastMessage: {
    fontSize: 14,
    color: '#666',
  },
  unreadBadge: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: 24,
    alignItems: 'center',
  },
  unreadText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
});
```

### Hybrid Approach: Database + GetStream

```typescript
import React, { useEffect, useState } from 'react';
import { StreamChat } from 'stream-chat';
import { Chat, Channel, MessageList, MessageInput } from 'stream-chat-react-native';

const HybridChatChannel = ({ authToken, channelId }) => {
  const [chatClient, setChatClient] = useState<StreamChat | null>(null);
  const [messages, setMessages] = useState([]);
  const [streamChannel, setStreamChannel] = useState(null);

  useEffect(() => {
    initializeChat();
  }, [channelId]);

  const initializeChat = async () => {
    const chatService = new ChatService(authToken);

    // 1. Load historical messages from database
    const dbMessages = await chatService.getChannelMessages(channelId, 50);
    setMessages(dbMessages.data);

    // 2. Initialize GetStream for real-time
    const streamData = await chatService.getStreamToken();
    const client = StreamChat.getInstance(streamData.data.apiKey);

    await client.connectUser(
      { id: streamData.data.userId },
      streamData.data.token
    );

    // 3. Connect to the channel
    const channel = client.channel('messaging', channelId);
    await channel.watch();

    setChatClient(client);
    setStreamChannel(channel);

    // 4. Listen for new messages via GetStream
    channel.on('message.new', (event) => {
      console.log('New message received:', event.message);
      // Optionally sync with database
      syncMessageToDatabase(event.message);
    });
  };

  const syncMessageToDatabase = async (message) => {
    // The message is already saved to DB by the backend when sent
    // This is just for local state updates if needed
    setMessages((prev) => [...prev, message]);
  };

  const sendMessage = async (text: string) => {
    const chatService = new ChatService(authToken);

    // Send via API (saves to DB and sends to GetStream)
    await chatService.sendMessage(channelId, text);

    // GetStream will receive the message and trigger 'message.new' event
  };

  if (!chatClient || !streamChannel) {
    return <Text>Loading...</Text>;
  }

  return (
    <Chat client={chatClient}>
      <Channel channel={streamChannel}>
        <MessageList />
        <MessageInput />
      </Channel>
    </Chat>
  );
};
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
const getChannels = async () => {
  try {
    const response = await fetch(`${API_URL}/user/chat/my-channels`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching channels:', error);
    // Show user-friendly error message
    Alert.alert('Error', 'Failed to load channels. Please try again.');
    return null;
  }
};
```

### 2. Token Management

Store and refresh tokens securely:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const saveTokens = async (accessToken: string, refreshToken: string) => {
  await AsyncStorage.setItem('access_token', accessToken);
  await AsyncStorage.setItem('refresh_token', refreshToken);
};

const getAccessToken = async () => {
  return await AsyncStorage.getItem('access_token');
};
```

### 3. Pagination

Implement pagination for message lists:

```typescript
const [currentPage, setCurrentPage] = useState(1);
const [messages, setMessages] = useState([]);
const [hasMore, setHasMore] = useState(true);

const loadMessages = async (channelId: string, page: number = 1) => {
  const chatService = new ChatService(authToken);
  const response = await chatService.getChannelMessages(channelId, page, 20);

  if (page === 1) {
    setMessages(response.data);
  } else {
    setMessages((prev) => [...prev, ...response.data]);
  }

  setHasMore(page < response.paging.totalPages);
  setCurrentPage(page);
};

const loadMoreMessages = async (channelId: string) => {
  if (hasMore) {
    await loadMessages(channelId, currentPage + 1);
  }
};
```

### 4. Offline Support

Use GetStream's offline support:

```typescript
const client = StreamChat.getInstance(apiKey, {
  enableInsights: true,
  enableWSFallback: true,
});
```

### 5. Cleanup

Always disconnect when unmounting:

```typescript
useEffect(() => {
  // ... initialization

  return () => {
    chatClient?.disconnectUser();
  };
}, []);
```

### 6. Type Safety

Use TypeScript interfaces:

```typescript
interface PageInfo {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginationResponse<T> {
  data: T[];
  paging: PageInfo;
}

interface Channel {
  id: string;
  type: string;
  name?: string;
  image?: string;
  memberIds: string[];
  memberCount: number;
  lastMessage?: {
    id: string;
    text: string;
    createdAt: string;
    user?: {
      id: string;
      name: string;
    };
  };
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface Message {
  id: string;
  text: string;
  user: {
    id: string;
    name: string;
    image?: string;
  };
  attachments?: any;
  reactions?: any;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
}

// Usage with pagination
type MessagesResponse = PaginationResponse<Message>;
```

### 7. Performance Optimization

```typescript
// Memoize chat client
const chatClient = useMemo(() => {
  return StreamChat.getInstance(apiKey);
}, [apiKey]);

// Use callbacks for event handlers
const handleNewMessage = useCallback((event) => {
  console.log('New message:', event.message);
}, []);
```

---

## Architecture Flow

```
┌─────────────────┐
│  React Native   │
│      App        │
└────────┬────────┘
         │
         ├─────────────────┐
         │                 │
         ▼                 ▼
┌─────────────────┐  ┌──────────────┐
│   Your API      │  │  GetStream   │
│   (Database)    │  │  (Real-time) │
└────────┬────────┘  └──────┬───────┘
         │                  │
         │  Sync on Send    │
         └──────────────────┘
```

### Message Flow:
1. User sends message via API
2. Backend saves to database
3. Backend sends to GetStream
4. GetStream broadcasts to all connected clients
5. All clients receive real-time update

### Channel List Flow:
1. Fetch from database for persistent data
2. Use GetStream for real-time updates
3. Merge and deduplicate results

---

## Troubleshooting

### Issue: Messages not appearing in real-time

**Solution:** Ensure GetStream client is properly connected:
```typescript
chatClient.on('connection.changed', (event) => {
  console.log('Connection status:', event.online);
});
```

### Issue: Duplicate channels in list

**Solution:** Deduplicate when combining my-channels and joined-channels:
```typescript
const uniqueChannels = allChannels.filter(
  (channel, index, self) =>
    index === self.findIndex((c) => c.id === channel.id)
);
```

### Issue: How to handle infinite scroll with pagination

**Solution:** Use the paging information to implement infinite scroll:
```typescript
const MessageList = ({ channelId }) => {
  const [messages, setMessages] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMessages = async (page: number) => {
    if (isLoading || !hasMore) return;

    setIsLoading(true);
    try {
      const chatService = new ChatService(authToken);
      const response = await chatService.getChannelMessages(channelId, page, 20);

      if (page === 1) {
        setMessages(response.data);
      } else {
        setMessages(prev => [...prev, ...response.data]);
      }

      setHasMore(page < response.paging.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoading) {
      loadMessages(currentPage + 1);
    }
  };

  useEffect(() => {
    loadMessages(1);
  }, [channelId]);

  return (
    <FlatList
      data={messages}
      renderItem={({ item }) => <MessageItem message={item} />}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={isLoading ? <LoadingSpinner /> : null}
    />
  );
};
```

### Issue: Token expired

**Solution:** Implement token refresh:
```typescript
const refreshToken = async () => {
  // Call your refresh endpoint
  const newToken = await refreshAuthToken();
  // Reconnect GetStream with new token
  await chatClient.disconnectUser();
  await chatClient.connectUser(user, newStreamToken);
};
```

---

## Support

For issues or questions:
- Backend API: Check error codes in response
- GetStream: https://getstream.io/chat/docs/
- React Native: https://reactnative.dev/docs/getting-started

---

## License

This integration guide is part of the Ventidole project.
