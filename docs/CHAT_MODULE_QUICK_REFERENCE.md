# Chat Module - Quick Reference Guide

## Table of Contents
- [REST API Endpoints](#rest-api-endpoints)
- [WebSocket Events](#websocket-events)
- [Configuration](#configuration)
- [Type Definitions](#type-definitions)

---

## REST API Endpoints

### Channels

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/chat/channels` | Create a new channel | Required |
| GET | `/chat/channels` | Get user's channels | Required |
| GET | `/chat/channels/:channelId` | Get channel details | Required |
| POST | `/chat/channels/archive` | Archive a channel | Required (Admin) |
| POST | `/chat/channels/:channelId/leave` | Leave a channel | Required |
| POST | `/chat/channels/participants` | Add participants | Required (Admin) |

### Messages

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/chat/messages` | Send a message | Required |
| GET | `/chat/channels/:channelId/messages` | Get messages (paginated) | Required |
| PATCH | `/chat/messages` | Update/edit a message | Required |
| DELETE | `/chat/messages` | Delete a message | Required |
| POST | `/chat/channels/read` | Mark messages as read | Required |

---

## WebSocket Events

### Connection
```javascript
const socket = io('ws://localhost:3000/chat', {
  auth: { token: 'jwt-token' }
});
```

### Client → Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `join_channel` | `{ channelId: string }` | Join a channel room |
| `leave_channel` | `{ channelId: string }` | Leave a channel room |
| `typing_start` | `{ channelId: string, userName: string }` | Start typing indicator |
| `typing_stop` | `{ channelId: string }` | Stop typing indicator |
| `message_read` | `{ channelId: string, messageId: string }` | Mark message as read |

### Server → Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | `ChatMessageResponse` | New message received |
| `message_updated` | `ChatMessageResponse` | Message was edited |
| `message_deleted` | `{ channelId, messageId }` | Message was deleted |
| `new_channel` | `ChatChannelResponse` | Added to new channel |
| `user_typing` | `{ channelId, userId, userName?, isTyping }` | User typing status |
| `user_status_changed` | `{ userId, isOnline, timestamp }` | User online/offline |
| `message_read_receipt` | `{ channelId, messageId, userId, readAt }` | Message read confirmation |

---

## Configuration

### Constants ([chat.constants.ts](../src/domain/chat/chat.constants.ts))

```typescript
{
  DEFAULT_MESSAGE_LIMIT: 50,          // Default pagination limit
  MAX_MESSAGE_LIMIT: 100,             // Maximum messages per request
  MAX_PARTICIPANTS_PER_CHANNEL: 500,  // Max participants in a channel
  MAX_PARTICIPANTS_GROUP_CHAT: 100,   // Max participants in group chat
  TYPING_TIMEOUT: 3000,               // Typing indicator timeout (ms)
  MESSAGE_EDIT_TIMEOUT: 900000,       // 15 minutes edit window
  MAX_MESSAGES_PER_MINUTE: 30,        // Rate limit (not enforced yet)
  ALLOWED_ORIGINS: [...],             // CORS allowed origins
}
```

### Environment Variables

```env
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
```

---

## Type Definitions

### Channel Types
```typescript
enum ChatChannelType {
  DIRECT = 'DIRECT',           // One-on-one
  GROUP = 'GROUP',             // Group chat
  ANNOUNCEMENT = 'ANNOUNCEMENT', // Idol announcements
  COMMUNITY = 'COMMUNITY'      // Community channels
}
```

### Message Types
```typescript
enum MessageType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  FILE = 'FILE'
}
```

### User Roles
```typescript
enum ChatRole {
  ADMIN = 'ADMIN',    // Can manage channel
  MEMBER = 'MEMBER'   // Regular participant
}
```

---

## Request/Response Examples

### Create Channel
```json
POST /chat/channels
{
  "name": "Team Chat",
  "description": "Project discussion",
  "type": "GROUP",
  "groupId": "group-uuid",
  "participantIds": ["user-1", "user-2"]
}
```

### Send Message
```json
POST /chat/messages
{
  "channelId": "channel-uuid",
  "type": "TEXT",
  "content": "Hello everyone!",
  "replyTo": "message-uuid"  // Optional
}
```

### Send Image Message
```json
POST /chat/messages
{
  "channelId": "channel-uuid",
  "type": "IMAGE",
  "content": "Check this out!",
  "mediaUrl": "https://cdn.example.com/image.jpg"
}
```

### Update Message
```json
PATCH /chat/messages
{
  "messageId": "message-uuid",
  "content": "Updated content"
}
```

### Delete Message
```json
DELETE /chat/messages
{
  "messageId": "message-uuid",
  "channelId": "channel-uuid"
}
```

### Get Messages (Paginated)
```
GET /chat/channels/:channelId/messages?limit=20&lastMessageId=msg-uuid

Response:
{
  "data": {
    "data": [...messages],
    "pagination": {
      "hasMore": true,
      "limit": 20,
      "lastMessageId": "last-msg-uuid"
    }
  }
}
```

### Add Participants
```json
POST /chat/channels/participants
{
  "channelId": "channel-uuid",
  "userIds": ["user-3", "user-4"]
}
```

### Mark as Read
```json
POST /chat/channels/read
{
  "channelId": "channel-uuid",
  "lastMessageId": "message-uuid"  // Optional
}
```

### Archive Channel
```json
POST /chat/channels/archive
{
  "channelId": "channel-uuid"
}
```

---

## Common Use Cases

### 1. Initialize Chat for a User
```javascript
// REST: Get all user's channels
const channels = await fetch('/chat/channels', {
  headers: { Authorization: `Bearer ${token}` }
});

// WebSocket: Connect and auto-join channels
const socket = io('ws://localhost:3000/chat', {
  auth: { token }
});
// Channels are auto-joined on connection
```

### 2. Load Messages for a Channel
```javascript
// First load
const response = await fetch(
  `/chat/channels/${channelId}/messages?limit=50`,
  { headers: { Authorization: `Bearer ${token}` }}
);
const { data: messages, pagination } = response.data;

// Load more (infinite scroll)
if (pagination.hasMore) {
  const moreMessages = await fetch(
    `/chat/channels/${channelId}/messages?limit=50&lastMessageId=${pagination.lastMessageId}`,
    { headers: { Authorization: `Bearer ${token}` }}
  );
}
```

### 3. Send and Edit a Message
```javascript
// Send
const message = await fetch('/chat/messages', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    channelId: 'channel-uuid',
    type: 'TEXT',
    content: 'Original message'
  })
});

// Edit (within 15 minutes)
await fetch('/chat/messages', {
  method: 'PATCH',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    messageId: message.data.id,
    content: 'Edited message'
  })
});
```

### 4. Real-time Typing Indicator
```javascript
let typingTimeout;

messageInput.addEventListener('input', () => {
  // Start typing
  socket.emit('typing_start', {
    channelId: currentChannelId,
    userName: currentUser.name
  });

  // Auto-stop after 3 seconds
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('typing_stop', { channelId: currentChannelId });
  }, 3000);
});

// Listen for others typing
socket.on('user_typing', ({ userId, userName, isTyping }) => {
  if (isTyping) {
    showTypingIndicator(`${userName} is typing...`);
  } else {
    hideTypingIndicator(userId);
  }
});
```

### 5. Handle Real-time Updates
```javascript
// New message
socket.on('new_message', (message) => {
  addMessageToUI(message);
  playNotificationSound();
});

// Message edited
socket.on('message_updated', (message) => {
  updateMessageInUI(message);
});

// Message deleted
socket.on('message_deleted', ({ channelId, messageId }) => {
  removeMessageFromUI(messageId);
});

// User status changed
socket.on('user_status_changed', ({ userId, isOnline }) => {
  updateUserStatus(userId, isOnline);
});
```

---

## Error Handling

### Common HTTP Status Codes

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 401 | Unauthorized | Invalid/expired JWT token |
| 403 | Forbidden | Not a channel participant, not admin |
| 400 | Bad Request | Validation failed, invalid data |
| 404 | Not Found | Channel/message doesn't exist |
| 500 | Server Error | Internal error |

### WebSocket Connection Errors

```javascript
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error.message);
  // Reasons: Invalid token, network error, CORS issue
});

socket.on('disconnect', (reason) => {
  if (reason === 'io server disconnect') {
    // Server disconnected (invalid token, etc.)
    // Attempt reconnection with new token
    socket.connect();
  }
});
```

---

## Permissions & Access Control

| Action | Required Role | Additional Checks |
|--------|---------------|-------------------|
| Create channel | Any user | - |
| Send message | Member | Not in announcement channel OR is admin |
| Edit message | Member | Must be sender, within 15min timeout |
| Delete message | Member | Must be sender OR channel admin |
| Add participants | Admin | Participant limit check |
| Archive channel | Admin | - |
| Leave channel | Member | - |

---

## Performance Tips

1. **Pagination**: Always use pagination for message lists
   ```javascript
   // Good: Paginated
   GET /chat/channels/:id/messages?limit=50

   // Bad: Fetch all
   GET /chat/channels/:id/messages?limit=10000
   ```

2. **WebSocket Rooms**: Join only active channels
   ```javascript
   // Join when viewing channel
   socket.emit('join_channel', { channelId });

   // Leave when navigating away
   socket.emit('leave_channel', { channelId });
   ```

3. **Typing Indicators**: Debounce typing events
   ```javascript
   const debouncedTyping = debounce(() => {
     socket.emit('typing_start', { channelId, userName });
   }, 300);
   ```

4. **Read Receipts**: Batch mark as read
   ```javascript
   // Mark as read when user scrolls to bottom
   // or after a delay, not on every message
   ```

---

## Testing

### Test WebSocket Connection
```javascript
const io = require('socket.io-client');

const socket = io('ws://localhost:3000/chat', {
  auth: { token: 'your-jwt-token' }
});

socket.on('connect', () => {
  console.log('Connected:', socket.id);
});

socket.on('connect_error', (err) => {
  console.error('Connection error:', err.message);
});
```

### Test REST Endpoints
```bash
# Get channels
curl -H "Authorization: Bearer TOKEN" \
  http://localhost:3000/chat/channels

# Send message
curl -X POST \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"channelId":"uuid","type":"TEXT","content":"Hello"}' \
  http://localhost:3000/chat/messages
```

---

## Troubleshooting

### WebSocket Not Connecting
1. Check JWT token is valid
2. Verify ALLOWED_ORIGINS includes your domain
3. Check network/firewall settings
4. Verify namespace is `/chat`

### Messages Not Appearing
1. Ensure joined channel room via `join_channel` event
2. Check WebSocket connection is active
3. Verify user is a channel participant

### Cannot Edit Message
1. Check if within 15-minute timeout
2. Verify user is the message sender
3. Ensure message exists and not deleted

### Cannot Add Participants
1. Verify user is channel admin
2. Check participant limit not exceeded
3. Ensure users exist in database

---

For detailed documentation, see [CHAT_MODULE_REFACTORING.md](./CHAT_MODULE_REFACTORING.md)
