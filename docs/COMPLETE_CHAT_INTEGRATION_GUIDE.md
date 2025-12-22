# Complete Chat Integration Guide - Idol Channel Management + Notifications

> **Integration of**: Idol channel management, GetStream real-time messaging, Knock notifications, and real-time event system

---

## 📚 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Backend Requirements](#backend-requirements)
3. [Frontend Implementation](#frontend-implementation)
4. [Notification System](#notification-system)
5. [Testing Guide](#testing-guide)

---

## 🏗️ Architecture Overview

### **Three-Layer System:**

```
┌──────────────────────────────────────────────────────────────┐
│                       USER ACTION                             │
│     (Create channel, Send message, Join community)            │
└──────────────────────────────────────────────────────────────┘
                            │
          ┌─────────────────┼──────────────────┐
          │                 │                  │
          ▼                 ▼                  ▼
┌─────────────────┐  ┌──────────────┐  ┌──────────────┐
│  BACKEND DB     │  │  GETSTREAM   │  │    KNOCK     │
│                 │  │              │  │              │
│ • Channel Meta  │  │ • Messages   │  │ • Push       │
│ • Ownership     │  │ • Real-time  │  │ • Email      │
│ • Communities   │  │ • Events     │  │ • In-app     │
└─────────────────┘  └──────────────┘  └──────────────┘
```

### **Data Storage:**

| Data Type | Storage | Reason |
|-----------|---------|--------|
| Channel metadata | Backend DB | Ownership, permissions, communities |
| Messages | GetStream | Real-time delivery, battle-tested |
| Notifications | Knock | Multi-channel delivery (push/email) |
| Real-time events | GetStream | WebSocket infrastructure |

---

## 🔧 Backend Requirements

### **1. Database Schema**

**channels table:**
```sql
CREATE TABLE channels (
  id VARCHAR(255) PRIMARY KEY,
  type VARCHAR(50) NOT NULL DEFAULT 'messaging',
  name VARCHAR(255),
  description TEXT,
  image VARCHAR(500),

  -- Ownership
  creator_id VARCHAR(255) NOT NULL,

  -- Community
  community_id VARCHAR(255),
  is_community_channel BOOLEAN DEFAULT false,

  -- Stats
  member_count INT DEFAULT 0,
  last_message_at TIMESTAMP,

  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  FOREIGN KEY (creator_id) REFERENCES users(id),
  FOREIGN KEY (community_id) REFERENCES communities(id)
);
```

**channel_members table:**
```sql
CREATE TABLE channel_members (
  id VARCHAR(255) PRIMARY KEY,
  channel_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY unique_channel_member (channel_id, user_id),
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### **2. Required API Endpoints**

#### **POST /v1/user/chat/channels** ⭐ CRITICAL

Create new channel (IDOL only).

**Request:**
```json
{
  "name": "My Channel",
  "description": "Channel description",
  "image": "https://example.com/image.jpg",
  "type": "messaging",
  "communityId": "community-123",
  "isCommunityChannel": false,
  "memberIds": ["user1", "user2"]
}
```

**Backend Implementation:**
```typescript
async createChannel(userId: string, dto: CreateChannelDto) {
  // 1. Validate IDOL role
  const user = await db.users.findById(userId);
  if (user.role !== 'IDOL') {
    throw new ForbiddenException('Only idols can create channels');
  }

  // 2. Generate channel ID
  const channelId = generateUUID();

  // 3. Save to database
  const channel = await db.channels.create({
    id: channelId,
    type: dto.type || 'messaging',
    name: dto.name,
    description: dto.description,
    image: dto.image,
    creator_id: userId,
    community_id: dto.communityId || null,
    is_community_channel: dto.isCommunityChannel || false,
    member_count: 1,
  });

  // 4. Add creator as member in DB
  await db.channel_members.create({
    id: generateUUID(),
    channel_id: channelId,
    user_id: userId,
    role: 'owner',
  });

  // 5. Create in GetStream
  const streamChannel = streamClient.channel(dto.type || 'messaging', channelId, {
    name: dto.name,
    image: dto.image,
    description: dto.description,
    created_by_id: userId,
  });
  await streamChannel.create();
  await streamChannel.addMembers([userId]);

  // 6. If community channel, add members
  if (dto.isCommunityChannel && dto.communityId) {
    const community = await db.communities.findById(dto.communityId);
    const members = await db.community_members.findMany({
      where: { community_id: dto.communityId },
    });

    // Add to GetStream
    const memberIds = members.map(m => m.user_id);
    await streamChannel.addMembers(memberIds);

    // Add to database
    for (const memberId of memberIds) {
      await db.channel_members.create({
        id: generateUUID(),
        channel_id: channelId,
        user_id: memberId,
        role: 'member',
      });
    }

    // Update member count
    await db.channels.update(
      { id: channelId },
      { member_count: memberIds.length + 1 }
    );

    // 7. Trigger notifications for community members
    await knockWorkflowService.notifyChannelCreated({
      recipientIds: memberIds,
      channelId,
      channelName: dto.name,
      creatorName: user.name,
      communityName: community.name,
    });

    // 8. Send real-time events
    for (const memberId of memberIds) {
      await getStreamNotificationService.emitChannelCreatedEvent({
        userId: memberId,
        channelId,
        channelName: dto.name,
        creatorName: user.name,
      });
    }
  }

  return {
    id: channel.id,
    type: channel.type,
    name: channel.name,
    description: channel.description,
    image: channel.image,
    creatorId: channel.creator_id,
    communityId: channel.community_id,
    isCommunityChannel: channel.is_community_channel,
    memberCount: channel.member_count,
    createdAt: channel.created_at.toISOString(),
    updatedAt: channel.updated_at.toISOString(),
  };
}
```

#### **GET /v1/user/chat/my-channels** ⭐ CRITICAL

Get idol's channels (created + community channels).

**Implementation:**
```typescript
async getMyChannels(userId: string) {
  // 1. Validate IDOL role
  const user = await db.users.findById(userId);
  if (user.role !== 'IDOL') {
    throw new ForbiddenException('Only idols can access this endpoint');
  }

  // 2. Get idol's communities
  const communities = await db.communities.findMany({
    where: { idol_id: userId },
  });
  const communityIds = communities.map(c => c.id);

  // 3. Query channels
  const channels = await db.channels.findMany({
    where: {
      OR: [
        { creator_id: userId },  // Channels created by idol
        {
          is_community_channel: true,
          community_id: { in: communityIds },  // Community channels
        },
      ],
    },
    orderBy: { last_message_at: 'desc' },
  });

  // 4. Fetch GetStream data for real-time info
  const channelIds = channels.map(ch => ch.id);
  const streamChannels = await streamClient.queryChannels(
    { id: { $in: channelIds } },
    {},
    { state: true }
  );

  // Create map for quick lookup
  const streamMap = new Map(streamChannels.map(ch => [ch.id, ch]));

  // 5. Merge DB + GetStream data
  return channels.map(dbChannel => {
    const streamChannel = streamMap.get(dbChannel.id);
    const lastMessage = streamChannel?.state?.messages?.[
      streamChannel.state.messages.length - 1
    ];

    return {
      id: dbChannel.id,
      type: dbChannel.type,
      name: dbChannel.name,
      description: dbChannel.description,
      image: dbChannel.image,
      creatorId: dbChannel.creator_id,
      communityId: dbChannel.community_id,
      isCommunityChannel: dbChannel.is_community_channel,
      memberCount: dbChannel.member_count,
      unreadCount: streamChannel?.state?.unreadCount || 0,
      lastMessage: lastMessage
        ? {
            id: lastMessage.id,
            text: lastMessage.text || '',
            createdAt: lastMessage.created_at.toISOString(),
            user: {
              id: lastMessage.user?.id || '',
              name: lastMessage.user?.name || '',
            },
          }
        : null,
      createdAt: dbChannel.created_at.toISOString(),
      updatedAt: dbChannel.updated_at.toISOString(),
    };
  });
}
```

#### **POST /v1/stream-chat/token** 🔴 FIX REQUIRED

**Current (WRONG):**
```typescript
const token = streamChatClient.createToken(userId, { role: 'user' });
```

**Fixed (CORRECT):**
```typescript
// ✅ Don't specify role - uses 'channel_member' by default
const token = streamChatClient.createToken(userId);
```

### **3. GetStream Notification Service**

**File:** `src/shared/service/getstream-notification/getstream-notification.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { StreamChat } from 'stream-chat';

@Injectable()
export class GetStreamNotificationService {
  private streamClient: StreamChat;

  constructor() {
    this.streamClient = StreamChat.getInstance(
      process.env.STREAM_API_KEY!,
      process.env.STREAM_API_SECRET!
    );
  }

  // Create notification channel on user registration
  async createNotificationChannel(userId: string) {
    const channel = this.streamClient.channel('team', `notifications-${userId}`, {
      name: 'Notifications',
      members: [userId],
    });
    await channel.create();
  }

  // Generic event emitter
  async emitEventToUser(userId: string, eventData: any) {
    const channel = this.streamClient.channel('team', `notifications-${userId}`);
    await channel.sendMessage({
      text: JSON.stringify(eventData),
      user_id: 'system',
      ...eventData,
    });
  }

  // Specific event emitters
  async emitChannelCreatedEvent(data: {
    userId: string;
    channelId: string;
    channelName: string;
    creatorName: string;
  }) {
    await this.emitEventToUser(data.userId, {
      type: 'channel_created',
      title: 'New Channel',
      message: `${data.creatorName} created ${data.channelName}`,
      data: {
        channelId: data.channelId,
        navigate: {
          screen: 'ChatWindow',
          params: { channelId: data.channelId, channelType: 'messaging' },
        },
      },
    });
  }

  async emitNewMessageEvent(data: {
    userId: string;
    channelId: string;
    channelName: string;
    senderName: string;
    messagePreview: string;
  }) {
    await this.emitEventToUser(data.userId, {
      type: 'new_message',
      title: data.senderName,
      message: data.messagePreview,
      data: {
        channelId: data.channelId,
        channelName: data.channelName,
      },
    });
  }

  async emitCommunityJoinedEvent(data: {
    idolId: string;
    fanName: string;
    communityId: string;
    communityName: string;
  }) {
    await this.emitEventToUser(data.idolId, {
      type: 'community_joined',
      title: 'New Follower',
      message: `${data.fanName} joined ${data.communityName}`,
      data: {
        communityId: data.communityId,
        invalidateQueries: ['community-followers', ['community', data.communityId]],
      },
    });
  }
}
```

### **4. Knock Workflow Service**

See `KNOCK_GETSTREAM_INTEGRATION.md` for complete Knock integration details.

**Key workflows needed:**
- `channel-created` - Notify when channel created
- `new-message` - Notify when message sent
- `community-joined` - Notify idol of new follower

---

## 📱 Frontend Implementation

### **✅ Already Implemented**

1. **useCreateChannel** - Hook to create channels
2. **useIdolChannels** - Hook to fetch idol's channels
3. **ChatChannelsProvider** - Role-based channel management
4. **CreateChannelModal** - UI for creating channels
5. **AllChats** - Channel list with FAB button for idols

### **🔄 To Implement**

#### **1. NotificationsChannelListener Component**

**File:** `src/components/NotificationsChannelListener.tsx`

```typescript
import React, { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react-native';
import { useCurrentUser } from 'src/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { showToast } from 'src/helpers/showToast';

export const NotificationsChannelListener: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const { client } = useChatContext();
  const { user } = useCurrentUser();
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  useEffect(() => {
    if (!client || !user?.uid) return;

    // Watch the notifications channel
    const channel = client.channel('team', `notifications-${user.uid}`);
    channel.watch().catch(err => {
      console.error('Error watching notification channel:', err);
    });

    // Listen for events
    const handleMessage = (event: any) => {
      const { type, title, message, data } = event.message;

      console.log('Notification event:', type);

      // Show toast
      if (title && message) {
        showToast({
          type: 'info',
          title,
          message,
        });
      }

      // Handle specific events
      switch (type) {
        case 'channel_created':
          queryClient.invalidateQueries(['chat-channels']);
          if (data?.navigate) {
            (navigation as any).navigate(
              data.navigate.screen,
              data.navigate.params
            );
          }
          break;

        case 'new_message':
          queryClient.invalidateQueries(['chat-channels']);
          break;

        case 'community_joined':
          if (data?.invalidateQueries) {
            data.invalidateQueries.forEach((queryKey: any) => {
              queryClient.invalidateQueries(
                Array.isArray(queryKey) ? queryKey : [queryKey]
              );
            });
          }
          break;

        case 'invalidate_queries':
          if (data?.queryKeys) {
            data.queryKeys.forEach((key: string) => {
              queryClient.invalidateQueries([key]);
            });
          }
          break;

        case 'navigate':
          if (data?.screen) {
            (navigation as any).navigate(data.screen, data.params || {});
          }
          break;
      }
    };

    channel.on('message.new', handleMessage);

    return () => {
      channel.off('message.new', handleMessage);
      channel.stopWatching().catch(() => {});
    };
  }, [client, user?.uid, queryClient, navigation]);

  return <>{children}</>;
};
```

#### **2. Update Provider Hierarchy**

**File:** `src/index.tsx`

```typescript
import { NotificationsChannelListener } from 'src/components/NotificationsChannelListener';

// ... existing imports

<BackendApiProvider backendApi={backendApi}>
  <AuthProvider>
    <StreamChatProvider>
      <ChatChannelsProvider>
        {/* Add NotificationsChannelListener here */}
        <NotificationsChannelListener>
          <KnockProvider>
            <Navigator />
          </KnockProvider>
        </NotificationsChannelListener>
      </ChatChannelsProvider>
    </StreamChatProvider>
  </AuthProvider>
</BackendApiProvider>
```

---

## 🧪 Testing Guide

### **Test 1: Create Channel (Idol)**

1. Login as IDOL user
2. Navigate to Chat screen
3. Click "+" floating button (bottom-right)
4. Enter channel name: "Test Channel"
5. Optionally enter description
6. Check "Community Channel" if applicable
7. Click "Create Channel"

**Expected:**
- ✅ Success toast appears
- ✅ New channel appears in channel list
- ✅ Auto-navigates to new channel
- ✅ Can send/receive messages

### **Test 2: Community Channel Notifications**

1. IDOL creates community channel
2. All community members should:
   - ✅ Receive push notification (if offline)
   - ✅ See real-time toast (if online)
   - ✅ Channel appears in their channel list
   - ✅ Can click notification to open channel

### **Test 3: Fetch Idol Channels**

1. IDOL logs in
2. Navigate to Chat screen

**Expected:**
- ✅ Shows channels created by idol
- ✅ Shows community channels
- ✅ Real-time unread counts
- ✅ Sorted by last message time

### **Test 4: Regular User (No Create)**

1. Login as regular user (FAN)
2. Navigate to Chat screen

**Expected:**
- ✅ No "+" button visible
- ✅ Only sees joined channels
- ✅ Can send/receive messages

---

## 📋 Implementation Checklist

### **Backend**
- [ ] Create `channels` table
- [ ] Create `channel_members` table
- [ ] Implement `POST /v1/user/chat/channels`
- [ ] Update `GET /v1/user/chat/my-channels`
- [ ] Fix `POST /v1/stream-chat/token` (remove role: 'user')
- [ ] Create GetStreamNotificationService
- [ ] Integrate with KnockWorkflowService
- [ ] Create GetStream webhook handler (for message events)

### **Frontend**
- [x] `useCreateChannel` hook
- [x] `useIdolChannels` hook
- [x] `ChatChannelsProvider` with role-based logic
- [x] `CreateChannelModal` UI
- [x] Floating action button for idols
- [ ] `NotificationsChannelListener` component
- [ ] Update provider hierarchy in `src/index.tsx`
- [ ] Test end-to-end flow

### **Knock**
- [ ] Create workflow: `channel-created`
- [ ] Create workflow: `new-message`
- [ ] Create workflow: `community-joined`
- [ ] Configure FCM/APNS push channels
- [ ] Configure email templates

---

## 🚨 Current Blockers

### **1. Permission Error (CRITICAL)**
**Error:** "User 'xxx' with role 'user' is not allowed to perform action ReadChannel"

**Fix:** Backend must remove `role: 'user'` from token generation

**File:** Token generation endpoint

**Code:**
```typescript
// ❌ WRONG
const token = streamChatClient.createToken(userId, { role: 'user' });

// ✅ CORRECT
const token = streamChatClient.createToken(userId);
```

### **2. Missing Backend Endpoints**
- POST /v1/user/chat/channels
- Updated GET /v1/user/chat/my-channels

---

## 📚 Related Documentation

- `CHAT_NOTIFICATION_ARCHITECTURE.md` - Complete architecture details
- `KNOCK_GETSTREAM_INTEGRATION.md` - Knock integration guide
- `GETSTREAM_ONLY_ARCHITECTURE.md` - GetStream-only approach
- `GETSTREAM_PERMISSION_FIX.md` - Permission error details

---

**Last Updated:** 2025-12-22
**Status:** ✅ Frontend 90% Complete | ⏳ Backend Pending
**Priority:** 🔴 CRITICAL - Chat feature blocked
