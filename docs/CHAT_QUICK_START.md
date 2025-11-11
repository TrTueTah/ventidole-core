# Chat System - Quick Start Guide

## 🚀 Installation Steps

### 1. Install Dependencies
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### 2. Run Database Migration
```bash
npx prisma migrate dev --name add_chat_system
npx prisma generate
```

### 3. Verify Setup
The following files have been created:

**Domain Structure:**
- ✅ `src/domain/chat/chat.module.ts`
- ✅ `src/domain/chat/chat.controller.ts`
- ✅ `src/domain/chat/chat.service.ts`
- ✅ `src/domain/chat/chat.gateway.ts` (WebSocket)

**DTOs:**
- ✅ `src/domain/chat/request/create-channel.request.ts`
- ✅ `src/domain/chat/request/send-message.request.ts`
- ✅ `src/domain/chat/request/add-participants.request.ts`
- ✅ `src/domain/chat/request/mark-as-read.request.ts`
- ✅ `src/domain/chat/response/chat.response.ts`

**Enums & Interfaces:**
- ✅ `src/domain/chat/enum/message.enum.ts`
- ✅ `src/domain/chat/interface/chat.interface.ts`
- ✅ `src/shared/enum/message.enum.ts`

**Notification Service:**
- ✅ `src/shared/service/notification/notification.service.ts`
- ✅ `src/shared/service/notification/notification.module.ts`

**Database:**
- ✅ PostgreSQL: `ChatChannel`, `ChatParticipant` models
- ✅ Firebase: `chat_messages` collection
- ✅ Module registered in `app.module.ts`

## 📡 Test WebSocket Connection

### Backend (Server Running)
```bash
npm run start:dev
```

### Frontend (Test Client)
```javascript
// test-websocket.html
<!DOCTYPE html>
<html>
<head>
  <script src="https://cdn.socket.io/4.5.4/socket.io.min.js"></script>
</head>
<body>
  <h1>Chat WebSocket Test</h1>
  <div id="status">Disconnected</div>
  <div id="messages"></div>

  <script>
    const socket = io('http://localhost:3000/chat', {
      auth: {
        token: 'YOUR_JWT_TOKEN_HERE'
      }
    });

    socket.on('connect', () => {
      document.getElementById('status').textContent = 'Connected ✅';
      console.log('Connected to chat server');
    });

    socket.on('disconnect', () => {
      document.getElementById('status').textContent = 'Disconnected ❌';
    });

    socket.on('new_message', (message) => {
      console.log('New message:', message);
      const div = document.createElement('div');
      div.textContent = `${message.senderName}: ${message.content}`;
      document.getElementById('messages').appendChild(div);
    });

    socket.on('user_typing', (data) => {
      console.log('User typing:', data);
    });

    socket.on('user_status_changed', (data) => {
      console.log('User status changed:', data);
    });

    // Test joining a channel
    socket.emit('join_channel', { channelId: 'test-channel-id' });
  </script>
</body>
</html>
```

## 🧪 Test API Endpoints

### 1. Create a Channel
```bash
curl -X POST http://localhost:3000/chat/channels \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Channel",
    "type": "GROUP",
    "groupId": "your-group-id"
  }'
```

### 2. Send a Message
```bash
curl -X POST http://localhost:3000/chat/messages \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "channelId": "channel-id",
    "type": "TEXT",
    "content": "Hello World!"
  }'
```

### 3. Get Your Channels
```bash
curl http://localhost:3000/chat/channels \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 4. Get Messages
```bash
curl "http://localhost:3000/chat/channels/CHANNEL_ID/messages?limit=50" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🎯 Key Features Implemented

### ✅ Real-time Messaging
- WebSocket connection with JWT authentication
- Auto-join user channels on connect
- Real-time message broadcasting
- Typing indicators
- Online/offline status

### ✅ REST API
- Create channels (DIRECT, GROUP, ANNOUNCEMENT)
- Send messages (TEXT, IMAGE, VIDEO, AUDIO, FILE)
- Get channel list with unread counts
- Get message history with pagination
- Mark messages as read
- Add/remove participants

### ✅ Push Notifications
- FCM integration
- Send to individual devices
- Send to multiple devices (multicast)
- Topic subscriptions
- Automatic notification on new messages

### ✅ Database Architecture
- **PostgreSQL**: Channels, participants, metadata
- **Firebase**: Message content, media URLs
- Optimized for both querying and real-time updates

### ✅ Security
- JWT authentication for REST and WebSocket
- Channel-based authorization
- Announcement channel restrictions (idols only)
- Admin-only participant management

## 🔧 Configuration

### Environment Variables
Ensure these are set in your `.env`:
```env
# JWT
JWT_SECRET=your-secret-key

# PostgreSQL
DATABASE_URL=postgresql://...

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
```

## 📊 Database Schema

### PostgreSQL Tables
```sql
-- Chat Channels
CREATE TABLE chat_channels (
  id TEXT PRIMARY KEY,
  name VARCHAR(255),
  type ChatChannelType NOT NULL,
  group_id TEXT,
  idol_id TEXT,
  is_announcement BOOLEAN DEFAULT FALSE,
  firebase_doc_id VARCHAR(255) UNIQUE NOT NULL,
  last_message_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Chat Participants
CREATE TABLE chat_participants (
  id TEXT PRIMARY KEY,
  channel_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role ChatRole DEFAULT 'MEMBER',
  last_read_at TIMESTAMP,
  unread_count INTEGER DEFAULT 0,
  is_muted BOOLEAN DEFAULT FALSE,
  UNIQUE(channel_id, user_id)
);
```

### Firebase Collection
```javascript
// chat_messages/{messageId}
{
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: 'TEXT' | 'IMAGE' | 'VIDEO' | 'AUDIO' | 'FILE' | 'SYSTEM';
  content: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  metadata?: object;
  replyTo?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isDeleted: boolean;
  readBy: string[];
}
```

## 🎨 Frontend Integration Example

### React/Next.js
```typescript
// hooks/useChat.ts
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export function useChat(token: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const newSocket = io('http://localhost:3000/chat', {
      auth: { token }
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('new_message', (message) => {
      setMessages(prev => [...prev, message]);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [token]);

  const sendMessage = async (channelId: string, content: string) => {
    const response = await fetch('/chat/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        channelId,
        type: 'TEXT',
        content
      })
    });
    return response.json();
  };

  return { socket, messages, isConnected, sendMessage };
}
```

## 📖 Next Steps

1. **Read Full Documentation**: See [CHAT_SYSTEM.md](./CHAT_SYSTEM.md)
2. **Test WebSocket**: Use the test client above
3. **Implement Frontend**: Connect your mobile/web app
4. **Configure FCM**: Set up push notifications
5. **Customize**: Adjust CORS, add features, etc.

## 🐛 Common Issues

### Issue: WebSocket not connecting
**Solution**: Install required packages:
```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### Issue: Prisma types not found
**Solution**: Generate Prisma client:
```bash
npx prisma generate
```

### Issue: Firebase not initialized
**Solution**: Check environment variables and Firebase credentials

### Issue: CORS errors
**Solution**: Update `cors` config in `chat.gateway.ts`:
```typescript
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:3001', // Your frontend URL
    credentials: true,
  },
  namespace: '/chat',
})
```

## 🎉 You're Ready!

The chat system is now fully set up and ready to use. Start the server and begin testing:

```bash
npm run start:dev
```

Access the API at: `http://localhost:3000/chat/*`
Connect WebSocket at: `ws://localhost:3000/chat`

Happy coding! 🚀
