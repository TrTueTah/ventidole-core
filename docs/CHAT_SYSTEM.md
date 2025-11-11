# Chat System Documentation

## Overview

The Ventidole chat system enables real-time messaging between idols and fans. It features:
- **Real-time messaging** via WebSocket (Socket.IO)
- **Announcement channels** where idols can broadcast to fans
- **Direct messaging** between users
- **Group channels** for group-related conversations
- **Push notifications** via Firebase Cloud Messaging (FCM)
- **Hybrid database architecture** for optimal performance

## Architecture

### Database Design

#### PostgreSQL (Metadata & Structure)
Stores channel and participant metadata for fast querying:
- `ChatChannel` - Channel information, type, group/idol associations
- `ChatParticipant` - User participation, read status, unread counts

#### Firebase Firestore (Messages)
Stores actual message content for scalability:
- `chat_messages` collection - Message content, media URLs, timestamps

### Why Hybrid Architecture?

| Feature | PostgreSQL | Firebase |
|---------|-----------|----------|
| **Use Case** | Metadata queries | Message storage |
| **Strengths** | Complex JOINs, ACID, Indexes | Real-time, Scalability, Cost-effective |
| **Data Stored** | Channels, participants, unread counts | Messages, media URLs |
| **Query Examples** | "Get all my channels", "Count unread" | "Get channel messages", "Stream new messages" |

## Installation

### 1. Install WebSocket Dependencies

```bash
npm install @nestjs/websockets @nestjs/platform-socket.io socket.io
```

### 2. Run Database Migration

```bash
npx prisma migrate dev --name add_chat_system
```

### 3. Update Environment Variables

Ensure Firebase credentials are configured in your `.env`:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY="your-private-key"
FIREBASE_CLIENT_EMAIL=your-client-email
```

## API Endpoints

### REST API

#### 1. Create Channel
```http
POST /chat/channels
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Fan Club",
  "description": "Official fan club channel",
  "type": "GROUP",
  "groupId": "group-id",
  "isAnnouncement": false,
  "participantIds": ["user-id-1", "user-id-2"]
}
```

#### 2. Get My Channels
```http
GET /chat/channels
Authorization: Bearer <token>
```

#### 3. Get Channel Details
```http
GET /chat/channels/:channelId
Authorization: Bearer <token>
```

#### 4. Send Message
```http
POST /chat/messages
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelId": "channel-id",
  "type": "TEXT",
  "content": "Hello fans!",
  "mediaUrl": "https://...",
  "replyTo": "message-id"
}
```

#### 5. Get Messages
```http
GET /chat/channels/:channelId/messages?limit=50&lastMessageId=msg-id
Authorization: Bearer <token>
```

#### 6. Mark as Read
```http
POST /chat/channels/read
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelId": "channel-id",
  "lastMessageId": "msg-id"
}
```

#### 7. Add Participants
```http
POST /chat/channels/participants
Authorization: Bearer <token>
Content-Type: application/json

{
  "channelId": "channel-id",
  "userIds": ["user-id-1", "user-id-2"]
}
```

#### 8. Leave Channel
```http
POST /chat/channels/:channelId/leave
Authorization: Bearer <token>
```

## WebSocket Events

### Connection

Connect to the WebSocket server at `/chat` namespace:

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000/chat', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Client → Server Events

#### 1. Join Channel
```javascript
socket.emit('join_channel', { channelId: 'channel-id' });
```

#### 2. Leave Channel
```javascript
socket.emit('leave_channel', { channelId: 'channel-id' });
```

#### 3. Typing Start
```javascript
socket.emit('typing_start', { 
  channelId: 'channel-id',
  userName: 'John Doe'
});
```

#### 4. Typing Stop
```javascript
socket.emit('typing_stop', { channelId: 'channel-id' });
```

#### 5. Message Read
```javascript
socket.emit('message_read', { 
  channelId: 'channel-id',
  messageId: 'msg-id'
});
```

### Server → Client Events

#### 1. New Message
```javascript
socket.on('new_message', (message) => {
  console.log('New message:', message);
  // {
  //   id: 'msg-id',
  //   channelId: 'channel-id',
  //   senderId: 'user-id',
  //   senderName: 'John Doe',
  //   content: 'Hello!',
  //   type: 'TEXT',
  //   createdAt: '2025-01-01T00:00:00Z'
  // }
});
```

#### 2. User Typing
```javascript
socket.on('user_typing', (data) => {
  console.log('User typing:', data);
  // {
  //   channelId: 'channel-id',
  //   userId: 'user-id',
  //   userName: 'John Doe',
  //   isTyping: true
  // }
});
```

#### 3. Message Read Receipt
```javascript
socket.on('message_read_receipt', (data) => {
  console.log('Message read:', data);
  // {
  //   channelId: 'channel-id',
  //   messageId: 'msg-id',
  //   userId: 'user-id',
  //   readAt: '2025-01-01T00:00:00Z'
  // }
});
```

#### 4. User Status Changed
```javascript
socket.on('user_status_changed', (data) => {
  console.log('User status:', data);
  // {
  //   userId: 'user-id',
  //   isOnline: true,
  //   timestamp: '2025-01-01T00:00:00Z'
  // }
});
```

#### 5. New Channel
```javascript
socket.on('new_channel', (channel) => {
  console.log('New channel:', channel);
  // Notification when added to a new channel
});
```

#### 6. Message Updated
```javascript
socket.on('message_updated', (message) => {
  console.log('Message updated:', message);
});
```

#### 7. Message Deleted
```javascript
socket.on('message_deleted', (data) => {
  console.log('Message deleted:', data);
  // { channelId: 'channel-id', messageId: 'msg-id' }
});
```

## Usage Examples

### Create an Announcement Channel (Idol)

```typescript
// Idol creates announcement channel for their group
const response = await fetch('/chat/channels', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    name: 'Official Updates',
    description: 'Get the latest updates from me!',
    type: 'ANNOUNCEMENT',
    idolId: 'idol-id',
    isAnnouncement: true,
    participantIds: [] // Fans will join automatically via follow
  })
});
```

### Send Message with Real-time Broadcast

```typescript
// 1. Send message via REST API
const message = await fetch('/chat/messages', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channelId: 'channel-id',
    type: 'TEXT',
    content: 'Hello everyone! 👋'
  })
});

// 2. All connected users in the channel receive it via WebSocket
// (automatically handled by ChatController → ChatGateway)
```

### Listen for Messages (Client)

```typescript
// Connect and authenticate
const socket = io('http://localhost:3000/chat', {
  auth: { token: yourJwtToken }
});

// Auto-joins all user's channels on connection

// Listen for new messages
socket.on('new_message', (message) => {
  if (message.channelId === currentChannelId) {
    displayMessage(message);
  }
  updateUnreadCount(message.channelId);
});

// Show typing indicators
socket.on('user_typing', (data) => {
  if (data.channelId === currentChannelId && data.isTyping) {
    showTypingIndicator(data.userName);
  } else {
    hideTypingIndicator(data.userId);
  }
});
```

### Implement Typing Indicator

```typescript
let typingTimeout;

function onUserTyping() {
  // Clear previous timeout
  clearTimeout(typingTimeout);
  
  // Emit typing start
  socket.emit('typing_start', {
    channelId: currentChannelId,
    userName: currentUserName
  });
  
  // Auto-stop after 3 seconds
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', { channelId: currentChannelId });
  }, 3000);
}
```

## Channel Types

### 1. DIRECT
One-on-one messaging between two users.

```typescript
{
  type: 'DIRECT',
  participantIds: ['user-1', 'user-2']
}
```

### 2. GROUP
Group discussions associated with an idol group.

```typescript
{
  type: 'GROUP',
  groupId: 'group-id',
  name: 'Fan Discussion',
  participantIds: ['user-1', 'user-2', ...]
}
```

### 3. ANNOUNCEMENT
Broadcast channel where only admins (idols) can send messages.

```typescript
{
  type: 'ANNOUNCEMENT',
  idolId: 'idol-id',
  isAnnouncement: true,
  name: 'Official Updates'
}
```

## Message Types

- `TEXT` - Plain text message
- `IMAGE` - Image with mediaUrl
- `VIDEO` - Video with mediaUrl and optional thumbnailUrl
- `AUDIO` - Audio with mediaUrl
- `FILE` - Document/file with mediaUrl
- `SYSTEM` - System-generated message (e.g., "User joined")

## Push Notifications

Push notifications are automatically sent when:
1. New message is sent (to all participants except sender)
2. User is not currently connected via WebSocket
3. User has not muted the channel
4. User has a valid device token

Notification payload:
```json
{
  "title": "John Doe",
  "body": "Hello everyone!",
  "data": {
    "type": "chat_message",
    "channelId": "channel-id",
    "senderId": "user-id"
  }
}
```

## Security

### Authentication
- JWT token required for both REST API and WebSocket
- WebSocket validates token on connection
- Expired tokens automatically disconnect

### Authorization
- Users can only access channels they're participants of
- Only admins can send messages in announcement channels
- Only admins can add participants to channels

### Data Privacy
- Messages stored in Firebase with channel-based access
- Participant data protected via PostgreSQL relations
- Sensitive user data (email, deviceToken) not exposed in public APIs

## Performance Considerations

### Database Queries
- PostgreSQL indexes on `userId`, `channelId`, `groupId`, `lastMessageAt`
- Firebase compound index on `channelId` + `createdAt`
- Pagination support for message history

### WebSocket Scalability
- Auto-join user channels on connection (avoid manual joins)
- Room-based broadcasting (only to channel participants)
- Connection tracking for online status

### Caching Strategy (Future)
- Cache channel list in Redis
- Cache unread counts in Redis
- Invalidate on new message

## Troubleshooting

### WebSocket Not Connecting
1. Check if `@nestjs/websockets` and `@nestjs/platform-socket.io` are installed
2. Verify JWT token is valid
3. Check CORS configuration in `chat.gateway.ts`

### Messages Not Appearing
1. Ensure user is a participant of the channel
2. Check if WebSocket is connected: `socket.connected`
3. Verify channel ID is correct

### Push Notifications Not Working
1. Check Firebase credentials in environment
2. Verify user has valid `deviceToken`
3. Check if channel is muted (`isMuted: false`)

## Future Enhancements

- [ ] Message reactions (emoji)
- [ ] Message editing and deletion
- [ ] File upload integration
- [ ] Voice/video call support
- [ ] Message search functionality
- [ ] Channel pinning
- [ ] User blocking
- [ ] End-to-end encryption
- [ ] Message forwarding
- [ ] Polls and surveys in channels

## Related Documentation

- [Prisma Schema](../../prisma/schema.prisma)
- [Firebase Setup](./FIREBASE_MOBILE_GUIDE.md)
- [Notification Service](../../src/shared/service/notification/notification.service.ts)
- [API Response Pattern](./API_RESPONSE_PATTERN.md)
