# Backend Chat Requirements - TODO List

## Current Implementation Status ✅

Your backend already implements the core chat functionality:

### Working Endpoints:
- ✅ `POST /v1/stream-chat/token` - Generate Stream Chat token
- ✅ `GET /v1/user/chat/my-channels` - Get channels owned by idol
- ✅ `GET /v1/user/chat/joined-channels` - Get channels user joined
- ✅ `GET /v1/user/chat/channels/{channelId}/messages` - Get messages (paginated)
- ✅ `POST /v1/user/chat/channels/{channelId}/messages` - Send message

---

## Priority 1: Essential Enhancements 🔴

These are critical for the best user experience with the new frontend implementation.

### 1. **Enhance Channel Response with Real-time Fields** 🔴

**Current Response:**
```typescript
interface ChannelDto {
  id: string;
  type: string;
  name?: string;
  image?: string;
  memberIds: string[];
  memberCount: number;
  // Missing fields below ↓
}
```

**Required Enhancement:**
```typescript
interface ChannelDto {
  id: string;
  type: string;
  name?: string;
  image?: string;
  memberIds: string[];
  memberCount: number;

  // ADD THESE FIELDS:
  lastMessage?: {
    id: string;
    text: string;
    createdAt: string;
    user: {
      id: string;
      name: string;
    };
  };
  unreadCount: number;  // Per-user unread count
  last_message_at?: string;  // ISO timestamp for sorting
  createdAt: string;
  updatedAt: string;
}
```

**Implementation Guide:**

```typescript
// 1. Add last_message_at field to Channel table
// Migration:
ALTER TABLE channels ADD COLUMN last_message_at TIMESTAMP;

// 2. Update last_message_at when message is sent
async function sendMessage(channelId: string, message: MessageDto) {
  // Save message to database
  await db.messages.create({ channelId, ...message });

  // Update channel's last_message_at
  await db.channels.update({
    where: { id: channelId },
    data: {
      last_message_at: new Date(),
      updated_at: new Date()
    }
  });

  // Send to Stream Chat
  await streamChatClient.channel(channelType, channelId).sendMessage({
    text: message.text,
    user_id: message.userId
  });
}

// 3. Calculate unreadCount per user
async function getChannelsForUser(userId: string) {
  const channels = await db.channels.findMany({
    where: {
      participants: {
        some: { userId }
      }
    },
    include: {
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1, // Get last message
        include: { user: true }
      },
      participants: true
    }
  });

  return channels.map(channel => ({
    ...channel,
    lastMessage: channel.messages[0] ? {
      id: channel.messages[0].id,
      text: channel.messages[0].text,
      createdAt: channel.messages[0].createdAt,
      user: {
        id: channel.messages[0].user.id,
        name: channel.messages[0].user.name
      }
    } : undefined,
    unreadCount: await calculateUnreadCount(channel.id, userId),
    last_message_at: channel.last_message_at
  }));
}

// 4. Calculate unread count
async function calculateUnreadCount(channelId: string, userId: string) {
  // Get user's last read message ID
  const participant = await db.channelParticipants.findFirst({
    where: { channelId, userId }
  });

  const lastReadAt = participant?.lastReadAt || new Date(0);

  // Count messages after last read
  return await db.messages.count({
    where: {
      channelId,
      createdAt: { gt: lastReadAt },
      userId: { not: userId } // Don't count own messages
    }
  });
}
```

**Database Schema Changes:**
```sql
-- Add to channels table
ALTER TABLE channels ADD COLUMN last_message_at TIMESTAMP;
CREATE INDEX idx_channels_last_message_at ON channels(last_message_at);

-- Add to channel_participants table (if not exists)
ALTER TABLE channel_participants ADD COLUMN last_read_at TIMESTAMP DEFAULT NOW();
CREATE INDEX idx_channel_participants_last_read ON channel_participants(channel_id, user_id, last_read_at);
```

---

### 2. **Mark Channel as Read Endpoint** 🔴

Create an endpoint to mark all messages in a channel as read.

**Endpoint:**
```
POST /v1/user/chat/channels/{channelId}/read
```

**Implementation:**
```typescript
// Controller
async function markChannelAsRead(channelId: string, userId: string) {
  // Update participant's lastReadAt
  await db.channelParticipants.update({
    where: {
      channelId_userId: { channelId, userId }
    },
    data: {
      lastReadAt: new Date()
    }
  });

  // Also mark as read in Stream Chat
  const streamChannel = streamChatClient.channel('messaging', channelId);
  await streamChannel.markRead({ user_id: userId });

  return { success: true };
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "Channel marked as read",
  "data": null
}
```

---

### 3. **Ensure Message Sync to Stream Chat** 🔴

Verify that when `POST /v1/user/chat/channels/{channelId}/messages` is called, the message is:
1. ✅ Saved to database
2. ✅ Sent to Stream Chat
3. ✅ Updates channel's `last_message_at`

**Current Implementation Check:**
```typescript
// This should already be implemented like this:
async function sendMessage(channelId: string, messageDto: SendMessageDto, userId: string) {
  // 1. Save to database
  const message = await db.messages.create({
    data: {
      channelId,
      userId,
      text: messageDto.text,
      parentId: messageDto.parentId
    },
    include: { user: true }
  });

  // 2. Update channel timestamp
  await db.channels.update({
    where: { id: channelId },
    data: {
      last_message_at: new Date(),
      updated_at: new Date()
    }
  });

  // 3. Send to Stream Chat
  const streamChannel = streamChatClient.channel('messaging', channelId);
  await streamChannel.sendMessage({
    id: message.id, // Use same ID for consistency
    text: message.text,
    user_id: userId,
    created_at: message.createdAt
  });

  return message;
}
```

**Verification:**
- [ ] Confirm messages appear in Stream Chat UI
- [ ] Confirm messages persist in database
- [ ] Confirm channel order updates when message sent

---

## Priority 2: Nice-to-Have Features 🟡

### 4. **Typing Indicators** 🟡

**Endpoint:**
```
POST /v1/user/chat/channels/{channelId}/typing
Body: { isTyping: boolean }
```

**Implementation:**
```typescript
async function sendTypingIndicator(
  channelId: string,
  userId: string,
  isTyping: boolean
) {
  const streamChannel = streamChatClient.channel('messaging', channelId);

  if (isTyping) {
    await streamChannel.keystroke({ user_id: userId });
  } else {
    await streamChannel.stopTyping({ user_id: userId });
  }

  return { success: true };
}
```

---

### 5. **User Presence (Online/Offline)** 🟡

Stream Chat automatically tracks user presence when they connect. No backend changes needed!

**Frontend Usage:**
```typescript
// User goes online when connecting to Stream Chat
await chatClient.connectUser({ id: userId }, token);

// User automatically appears offline when disconnecting
await chatClient.disconnectUser();
```

---

### 6. **Message Reactions** 🟡

**Endpoint:**
```
POST /v1/user/chat/channels/{channelId}/messages/{messageId}/reactions
Body: { type: 'like' | 'love' | 'haha' | 'wow' | 'sad' | 'angry' }
```

**Implementation:**
```typescript
async function addReaction(
  channelId: string,
  messageId: string,
  userId: string,
  reactionType: string
) {
  // Save to database (optional)
  await db.messageReactions.create({
    data: { messageId, userId, type: reactionType }
  });

  // Send to Stream Chat
  const streamChannel = streamChatClient.channel('messaging', channelId);
  await streamChannel.sendReaction(messageId, {
    type: reactionType,
    user_id: userId
  });

  return { success: true };
}
```

---

## Priority 3: Moderation & Safety 🟢

### 7. **Report Message/User** 🟢

**Endpoint:**
```
POST /v1/user/chat/report
Body: {
  channelId: string;
  messageId?: string;
  reportedUserId?: string;
  reason: string;
}
```

**Implementation:**
```typescript
async function reportContent(reportDto: ReportDto, reporterId: string) {
  // Save report to database
  const report = await db.reports.create({
    data: {
      reporterId,
      channelId: reportDto.channelId,
      messageId: reportDto.messageId,
      reportedUserId: reportDto.reportedUserId,
      reason: reportDto.reason,
      status: 'pending'
    }
  });

  // Optionally flag in Stream Chat
  if (reportDto.messageId) {
    const streamChannel = streamChatClient.channel('messaging', reportDto.channelId);
    await streamChannel.flagMessage(reportDto.messageId);
  }

  // Notify admins
  await notifyAdmins(report);

  return { success: true };
}
```

---

### 8. **Block User** 🟢

**Endpoint:**
```
POST /v1/user/block/{blockedUserId}
DELETE /v1/user/block/{blockedUserId}
```

**Implementation:**
```typescript
async function blockUser(userId: string, blockedUserId: string) {
  // Save to database
  await db.blockedUsers.create({
    data: { userId, blockedUserId }
  });

  // Hide channels with blocked user
  // (Filter on frontend or backend)

  return { success: true };
}
```

---

### 9. **Admin Moderation Tools** 🟢

**Endpoints:**
```
GET /v1/admin/chat/reports - List all reports
PATCH /v1/admin/chat/reports/{reportId} - Update report status
DELETE /v1/admin/chat/messages/{messageId} - Delete message
POST /v1/admin/chat/users/{userId}/ban - Ban user from chat
```

---

## Priority 4: Advanced Features 🔵

### 10. **Message Search** 🔵

**Endpoint:**
```
GET /v1/user/chat/search?q={query}&channelId={channelId}
```

**Implementation:**
```typescript
async function searchMessages(query: string, channelId?: string, userId: string) {
  const where: any = {
    text: { contains: query, mode: 'insensitive' },
    channel: {
      participants: {
        some: { userId }
      }
    }
  };

  if (channelId) {
    where.channelId = channelId;
  }

  const messages = await db.messages.findMany({
    where,
    include: {
      user: true,
      channel: true
    },
    orderBy: { createdAt: 'desc' },
    take: 50
  });

  return messages;
}
```

---

### 11. **Message Attachments (Images/Files)** 🔵

**Endpoint:**
```
POST /v1/user/chat/channels/{channelId}/messages/attachment
Content-Type: multipart/form-data
```

**Implementation:**
```typescript
async function sendMessageWithAttachment(
  channelId: string,
  file: File,
  text: string,
  userId: string
) {
  // 1. Upload file to storage
  const fileUrl = await uploadFile(file);

  // 2. Save message with attachment
  const message = await db.messages.create({
    data: {
      channelId,
      userId,
      text,
      attachments: {
        create: {
          type: file.mimetype.startsWith('image/') ? 'image' : 'file',
          url: fileUrl,
          name: file.originalname
        }
      }
    }
  });

  // 3. Send to Stream Chat
  const streamChannel = streamChatClient.channel('messaging', channelId);
  await streamChannel.sendMessage({
    text,
    user_id: userId,
    attachments: [{
      type: 'image', // or 'file'
      asset_url: fileUrl,
      title: file.originalname
    }]
  });

  return message;
}
```

---

### 12. **Message Threads/Replies** 🔵

Already supported by `parentId` field in `SendMessageDto`! ✅

Just ensure frontend passes `parentId` when replying:
```typescript
await sendMessage({
  channelId: 'channel_123',
  text: 'This is a reply',
  parentId: 'message_456' // ID of message being replied to
});
```

---

## Testing Checklist for Backend

### Essential Tests:
- [ ] POST message → saves to DB ✅
- [ ] POST message → appears in Stream Chat ✅
- [ ] POST message → updates `last_message_at` ✅
- [ ] GET channels → returns `lastMessage` ✅
- [ ] GET channels → returns `unreadCount` ✅
- [ ] GET channels → sorted by `last_message_at` ✅
- [ ] POST read → marks channel as read ✅
- [ ] POST read → resets `unreadCount` to 0 ✅

### Advanced Tests:
- [ ] Typing indicators work
- [ ] Reactions appear in Stream Chat
- [ ] File attachments upload correctly
- [ ] Message threads/replies work
- [ ] Search returns relevant messages
- [ ] Reports saved to database
- [ ] Block user hides their messages

---

## Implementation Timeline

### Week 1: Critical Features 🔴
- [ ] Add `lastMessage`, `unreadCount`, `last_message_at` to channel response
- [ ] Create POST `/v1/user/chat/channels/{channelId}/read` endpoint
- [ ] Verify message sync to Stream Chat works correctly
- [ ] Test sorting by `last_message_at`

### Week 2: Polish 🟡
- [ ] Add typing indicators endpoint
- [ ] Add message reactions endpoint
- [ ] Test presence (online/offline) tracking

### Week 3: Moderation 🟢
- [ ] Create report endpoint
- [ ] Create block user endpoint
- [ ] Admin moderation tools

### Week 4: Advanced Features 🔵
- [ ] Message search
- [ ] File attachments
- [ ] Test message threads

---

## Database Migration Script

```sql
-- Add new columns to channels table
ALTER TABLE channels
ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_channels_last_message_at
ON channels(last_message_at DESC);

-- Add last_read_at to channel participants
ALTER TABLE channel_participants
ADD COLUMN IF NOT EXISTS last_read_at TIMESTAMP DEFAULT NOW();

CREATE INDEX IF NOT EXISTS idx_channel_participants_last_read
ON channel_participants(channel_id, user_id, last_read_at);

-- Create message_reactions table (optional)
CREATE TABLE IF NOT EXISTS message_reactions (
  id VARCHAR(255) PRIMARY KEY,
  message_id VARCHAR(255) NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'like', 'love', etc.
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(message_id, user_id, type)
);

CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);

-- Create reports table
CREATE TABLE IF NOT EXISTS reports (
  id VARCHAR(255) PRIMARY KEY,
  reporter_id VARCHAR(255) NOT NULL,
  channel_id VARCHAR(255) REFERENCES channels(id),
  message_id VARCHAR(255) REFERENCES messages(id),
  reported_user_id VARCHAR(255),
  reason TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'reviewed', 'resolved'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reports_status ON reports(status);
CREATE INDEX idx_reports_reporter ON reports(reporter_id);

-- Create blocked_users table
CREATE TABLE IF NOT EXISTS blocked_users (
  id VARCHAR(255) PRIMARY KEY,
  user_id VARCHAR(255) NOT NULL,
  blocked_user_id VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, blocked_user_id)
);

CREATE INDEX idx_blocked_users_user_id ON blocked_users(user_id);
```

---

## Summary

### ✅ Already Working:
- Basic chat functionality
- Message sending/receiving
- Channel listing
- Stream Chat integration

### 🔴 High Priority TODO:
1. Add `lastMessage`, `unreadCount`, `last_message_at` to API responses
2. Create mark-as-read endpoint
3. Verify message sync to Stream Chat

### 🟡 Medium Priority TODO:
4. Typing indicators
5. Message reactions

### 🟢 Low Priority TODO:
6. Reporting system
7. User blocking
8. Admin tools

### 🔵 Future Enhancements:
9. Message search
10. File attachments
11. Advanced moderation

---

## Contact Backend Team

When implementing, please coordinate with backend team on:
1. **Database schema changes** - Review migration script
2. **API response format** - Ensure TypeScript types match
3. **Stream Chat integration** - Verify message sync works
4. **Testing strategy** - Unit tests + integration tests

**Questions? Contact:**
- Frontend: [Your Team]
- Backend: [Backend Team]
- Stream Chat Docs: https://getstream.io/chat/docs/

---

**Last Updated:** 2025-01-21
**Version:** 1.0
**Status:** Ready for Backend Implementation
