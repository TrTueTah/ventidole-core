# Chat & Notification Architecture - Integrated Approach

## 🎯 Overview

Ventidole uses a **hybrid architecture** combining:
- **Backend Database**: Channel metadata, ownership, community associations
- **GetStream**: Real-time messaging + notification events
- **Knock**: Multi-channel notifications (push, in-app, email)

---

## 🏗️ Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    USER ACTION                               │
│         (Create channel, Send message, Join community)       │
└─────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   BACKEND    │  │  GETSTREAM   │  │    KNOCK     │
│   DATABASE   │  │              │  │              │
└──────────────┘  └──────────────┘  └──────────────┘
        │                 │                 │
        │                 ├─────────────────┤
        │                 │                 │
        ▼                 ▼                 ▼
┌──────────────┐  ┌──────────────┐  ┌──────────────┐
│   Channel    │  │ Real-time    │  │ Push/Email   │
│  Metadata    │  │ Messaging    │  │ Notifications│
│              │  │              │  │              │
│ • Ownership  │  │ • Messages   │  │ • FCM/APNS   │
│ • Community  │  │ • Events     │  │ • Email      │
│ • Members    │  │ • Presence   │  │ • In-app     │
└──────────────┘  └──────────────┘  └──────────────┘
```

---

## 📊 Data Storage Strategy

### **1. Backend Database** 📁

**Stores:**
- ✅ Channel metadata (name, description, image)
- ✅ Channel ownership (creator, community association)
- ✅ Channel members list
- ✅ Community relationships
- ❌ Messages (stored in GetStream)

**Why:**
- Ownership control and permissions
- Community channel associations
- Advanced queries and analytics
- Data governance

### **2. GetStream** ⚡

**Stores:**
- ✅ **Messages** (source of truth for messages)
- ✅ **Real-time events** via notification channels
- ✅ Channel state (online presence, typing indicators)
- ✅ Message history and pagination

**Why:**
- Battle-tested message storage
- Real-time message delivery
- WebSocket infrastructure
- Offline message queue

### **3. Knock** 🔔

**Handles:**
- ✅ Push notifications (FCM/APNS)
- ✅ Email notifications
- ✅ In-app notification feed
- ✅ Multi-channel workflows

**Why:**
- Reach users when app is closed
- Multi-channel delivery (push + email + in-app)
- Notification preferences management
- Analytics and tracking

---

## 🔄 Integration Flows

### **Flow 1: Create Channel**

```
1. IDOL clicks "Create Channel"
   ↓
2. Frontend → POST /v1/user/chat/channels
   ↓
3. Backend:
   ├─→ Save to Database (channels table)
   │   └─ Channel metadata, creator, community link
   │
   ├─→ Create in GetStream (same ID)
   │   └─ Channel for real-time messaging
   │
   └─→ Trigger Knock workflow (if community channel)
       └─ Notify all community members
   ↓
4. Frontend:
   ├─→ Shows success toast
   ├─→ Refetches channel list
   └─→ Navigates to new channel
```

**Backend Implementation:**
```typescript
// POST /v1/user/chat/channels
async createChannel(userId, channelDto) {
  // 1. Save to database
  const channel = await db.channels.create({
    id: generateUUID(),
    name: channelDto.name,
    creator_id: userId,
    community_id: channelDto.communityId,
    is_community_channel: channelDto.isCommunityChannel,
  });

  // 2. Create in GetStream
  const streamChannel = streamClient.channel('messaging', channel.id, {
    name: channelDto.name,
    image: channelDto.image,
    created_by_id: userId,
  });
  await streamChannel.create();
  await streamChannel.addMembers([userId]);

  // 3. If community channel, notify members
  if (channelDto.isCommunityChannel && channelDto.communityId) {
    const members = await getCommunityMembers(channelDto.communityId);

    // Add members to GetStream
    await streamChannel.addMembers(members.map(m => m.userId));

    // Trigger Knock notification
    await knockWorkflowService.notifyChannelCreated({
      recipientIds: members.map(m => m.userId),
      channelId: channel.id,
      channelName: channel.name,
      creatorName: user.name,
      communityName: community.name,
    });

    // Send real-time event via GetStream
    for (const member of members) {
      await getStreamNotificationService.emitChannelCreatedEvent({
        userId: member.userId,
        channelId: channel.id,
        channelName: channel.name,
        creatorName: user.name,
      });
    }
  }

  return channel;
}
```

---

### **Flow 2: Send Message**

```
1. USER types message and sends
   ↓
2. Frontend → GetStream (via MessageInput)
   ↓
3. GetStream:
   ├─→ Stores message
   ├─→ Broadcasts to all channel members (WebSocket)
   └─→ Updates channel.last_message_at
   ↓
4. Backend Webhook (GetStream → Backend):
   ├─→ Updates channels.last_message_at in DB
   │
   └─→ Trigger Knock for offline users:
       └─ Check who's offline
       └─ Send push notification
       └─ Send email (if enabled)
   ↓
5. Frontend (for online users):
   ├─→ Receives message via WebSocket
   ├─→ Displays instantly in MessageList
   └─→ Updates channel list order
```

**GetStream Webhook Handler:**
```typescript
// Webhook: POST /webhooks/getstream
async handleGetStreamWebhook(event) {
  if (event.type === 'message.new') {
    const { channel, message, user } = event;

    // 1. Update channel timestamp in DB
    await db.channels.update({
      where: { id: channel.id },
      data: { last_message_at: new Date() },
    });

    // 2. Get channel members
    const members = await db.channel_members.findMany({
      where: { channel_id: channel.id, is_active: true },
    });

    // 3. Check who's offline
    const onlineUsers = await getStreamNotificationService.getOnlineUsers(
      members.map(m => m.user_id)
    );

    const offlineMembers = members.filter(
      m => !onlineUsers.includes(m.user_id) && m.user_id !== user.id
    );

    // 4. Send push notifications to offline users
    for (const member of offlineMembers) {
      await knockWorkflowService.notifyNewMessage({
        recipientId: member.user_id,
        sender: {
          id: user.id,
          name: user.name,
          avatar: user.image,
        },
        channelId: channel.id,
        channelName: channel.name,
        messagePreview: message.text.substring(0, 100),
      });
    }

    // 5. Send real-time events to online users (via notification channel)
    for (const member of members) {
      if (member.user_id !== user.id) {
        await getStreamNotificationService.emitNewMessageEvent({
          userId: member.user_id,
          channelId: channel.id,
          channelName: channel.name,
          senderName: user.name,
          messagePreview: message.text.substring(0, 100),
        });
      }
    }
  }
}
```

---

### **Flow 3: User Joins Community**

```
1. FAN clicks "Join Community"
   ↓
2. Frontend → POST /v1/communities/{id}/join
   ↓
3. Backend:
   ├─→ Add to community_members table
   │
   ├─→ Add to community channels in GetStream
   │   └─ Find all community channels
   │   └─ Add user to each channel
   │
   ├─→ Trigger Knock notification to IDOL
   │   └─ "New follower: {fanName}"
   │
   └─→ Send real-time event to IDOL
       └─ Via GetStream notification channel
   ↓
4. IDOL sees:
   ├─→ Push notification (if offline)
   ├─→ Real-time toast (if online)
   └─→ Follower count updates
```

**Backend Implementation:**
```typescript
async joinCommunity(fanId, communityId) {
  // 1. Add to database
  await db.community_members.create({
    user_id: fanId,
    community_id: communityId,
  });

  // 2. Get community info
  const community = await db.communities.findUnique({
    where: { id: communityId },
    include: { idol: true },
  });

  // 3. Add to community channels in GetStream
  const communityChannels = await db.channels.findMany({
    where: {
      community_id: communityId,
      is_community_channel: true,
    },
  });

  for (const channel of communityChannels) {
    const streamChannel = streamClient.channel('messaging', channel.id);
    await streamChannel.addMembers([fanId]);
  }

  // 4. Notify idol via Knock (push notification)
  await knockWorkflowService.notifyCommunityJoined({
    idolId: community.idol_id,
    fan: {
      id: fanId,
      name: fan.name,
      avatar: fan.image,
    },
    communityId: community.id,
    communityName: community.name,
  });

  // 5. Notify idol via GetStream (real-time event)
  await getStreamNotificationService.emitCommunityJoinedEvent({
    idolId: community.idol_id,
    fanName: fan.name,
    communityId: community.id,
    communityName: community.name,
  });
}
```

---

## 🔔 GetStream Notification Channel System

### **What is it?**

Each user has a special GetStream channel: `notifications-{userId}`

**Purpose:**
- Real-time app events (not chat messages)
- Query invalidation triggers
- Navigation commands
- UI updates

### **Setup**

**Backend - Create on User Registration:**
```typescript
// When user signs up
async createUser(userData) {
  const user = await db.users.create(userData);

  // 1. Create GetStream notification channel
  await getStreamNotificationService.createNotificationChannel(user.id);

  // 2. Register in Knock
  await knockClient.users.identify(user.id, {
    email: user.email,
    name: user.name,
    avatar: user.image,
  });

  // 3. Create GetStream chat user
  await streamClient.upsertUser({
    id: user.id,
    name: user.name,
    image: user.image,
  });

  return user;
}
```

**Backend Service:**
```typescript
// src/shared/service/getstream-notification/getstream-notification.service.ts
export class GetStreamNotificationService {
  async createNotificationChannel(userId: string) {
    const channel = this.streamClient.channel('team', `notifications-${userId}`, {
      name: 'Notifications',
      members: [userId],
    });
    await channel.create();
  }

  async emitEventToUser(userId: string, eventData: any) {
    const channel = this.streamClient.channel('team', `notifications-${userId}`);
    await channel.sendMessage({
      text: JSON.stringify(eventData),
      user_id: 'system',
      type: eventData.type,
      ...eventData,
    });
  }

  // Specific event emitters
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
        navigate: { screen: 'ChatWindow', params: { channelId: data.channelId } },
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

### **Frontend - Listen for Events**

**File:** `src/components/NotificationsChannelListener.tsx`

```typescript
import React, { useEffect } from 'react';
import { useChatContext } from 'stream-chat-react-native';
import { useCurrentUser } from 'src/hooks/useCurrentUser';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigation } from '@react-navigation/native';
import { showToast } from 'src/helpers/showToast';

export const NotificationsChannelListener: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
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

      console.log('Notification event received:', type);

      // Show toast notification
      if (title && message) {
        showToast({
          type: 'info',
          title,
          message,
        });
      }

      // Handle specific event types
      switch (type) {
        case 'new_message':
          // Invalidate channel list to reorder
          queryClient.invalidateQueries(['chat-channels']);
          break;

        case 'channel_created':
          // Invalidate channel list to show new channel
          queryClient.invalidateQueries(['chat-channels']);

          // Navigate if data provided
          if (data?.navigate) {
            (navigation as any).navigate(
              data.navigate.screen,
              data.navigate.params
            );
          }
          break;

        case 'community_joined':
          // Invalidate queries
          if (data?.invalidateQueries) {
            data.invalidateQueries.forEach((queryKey: any) => {
              queryClient.invalidateQueries(
                Array.isArray(queryKey) ? queryKey : [queryKey]
              );
            });
          }
          break;

        case 'order_status_updated':
          // Invalidate order queries
          queryClient.invalidateQueries(['orders']);
          if (data?.orderId) {
            queryClient.invalidateQueries(['order', data.orderId]);
          }
          break;

        case 'invalidate_queries':
          // Generic query invalidation
          if (data?.queryKeys) {
            data.queryKeys.forEach((key: any) => {
              queryClient.invalidateQueries([key]);
            });
          }
          break;

        case 'navigate':
          // Navigate to specific screen
          if (data?.screen) {
            (navigation as any).navigate(data.screen, data.params || {});
          }
          break;

        default:
          console.log('Unknown notification type:', type);
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

---

## 📱 Frontend Provider Hierarchy

**File:** `src/index.tsx`

```typescript
import { NotificationsChannelListener } from 'src/components/NotificationsChannelListener';
import { KnockProvider } from 'src/contexts/KnockProvider';

<BackendApiProvider backendApi={backendApi}>
  <AuthProvider>
    <StreamChatProvider>
      <ChatChannelsProvider>
        <KnockProvider>
          <NotificationsChannelListener>
            <Navigator />
          </NotificationsChannelListener>
        </KnockProvider>
      </ChatChannelsProvider>
    </StreamChatProvider>
  </AuthProvider>
</BackendApiProvider>
```

---

## 🔔 Knock Integration

### **Purpose**

Knock handles notifications when users are:
- Offline (app closed)
- Background (app not active)
- Different device

### **Channels:**
1. **Push Notifications** (FCM/APNS)
2. **Email**
3. **In-app Feed**

### **Workflow Examples**

**1. New Message:**
```typescript
await knockWorkflowService.notifyNewMessage({
  recipientId: userId,
  sender: { id, name, avatar },
  channelId,
  channelName,
  messagePreview: message.text,
});
```

**2. Channel Created:**
```typescript
await knockWorkflowService.notifyChannelCreated({
  recipientIds: memberIds,
  channelId,
  channelName,
  creatorName,
});
```

**3. Community Joined:**
```typescript
await knockWorkflowService.notifyCommunityJoined({
  idolId,
  fan: { id, name, avatar },
  communityId,
  communityName,
});
```

### **Frontend KnockProvider**

**File:** `src/contexts/KnockProvider.tsx`

```typescript
import React, { useEffect, useRef } from 'react';
import { Knock } from '@knocklabs/client';
import { KNOCK_PUBLIC_API_KEY, KNOCK_IN_APP_FEED_ID } from 'constants/knock';
import { useCurrentUser } from 'src/hooks/useCurrentUser';
import { useContext } from 'react';
import { BackendApiContext } from './BackendApiContex';

export const KnockProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user } = useCurrentUser();
  const backendApi = useContext(BackendApiContext);
  const knockClient = useRef<Knock | null>(null);

  useEffect(() => {
    if (!user?.uid) return;

    const initializeKnock = async () => {
      try {
        // Initialize Knock client
        knockClient.current = new Knock(KNOCK_PUBLIC_API_KEY);

        // Get auth token from backend
        const response = await backendApi.client.GET('/v1/knock/auth/token' as any);
        const token = response.data?.data?.token;

        if (!token) {
          console.error('Failed to get Knock token');
          return;
        }

        // Authenticate user
        await knockClient.current.authenticate(user.uid, token);

        // Setup in-app feed
        const feed = knockClient.current.feeds.initialize(KNOCK_IN_APP_FEED_ID, {
          auto_manage_socket_connection: true,
        });

        feed.on('items.received', (items) => {
          console.log('Knock items received:', items.length);
          // Update badge count, etc.
        });
      } catch (error) {
        console.error('Error initializing Knock:', error);
      }
    };

    initializeKnock();

    return () => {
      if (knockClient.current) {
        knockClient.current.teardown();
      }
    };
  }, [user?.uid, backendApi]);

  return <>{children}</>;
};
```

---

## 🎯 Benefits of This Architecture

### **1. Real-time Everything** ⚡
- **Messages**: Instant via GetStream WebSocket
- **Events**: Real-time via GetStream notification channels
- **UI Updates**: Auto-refresh via React Query invalidation

### **2. Offline Support** 📴
- **Knock**: Sends push when user offline
- **GetStream**: Queues messages for delivery when back online
- **React Query**: Re-fetches on reconnection

### **3. Multi-Channel Delivery** 📬
- **In-app**: Real-time toast notifications
- **Push**: Native notifications (FCM/APNS)
- **Email**: Optional email notifications
- **In-app Feed**: Persistent notification history

### **4. Scalability** 📈
- **GetStream**: Handles millions of concurrent connections
- **Knock**: Automatic multi-channel routing
- **Backend**: Only stores metadata (lightweight)

### **5. Flexibility** 🔧
- **Messages in GetStream**: Can migrate to DB later if needed
- **Channels in DB**: Full control over permissions
- **Notifications via Knock**: Easy to add new channels

---

## 📋 Implementation Checklist

### **Backend**
- [ ] Create `channels` table
- [ ] Create `channel_members` table
- [ ] Implement `POST /v1/user/chat/channels`
- [ ] Update `GET /v1/user/chat/my-channels`
- [ ] Create GetStream webhook handler
- [ ] Integrate Knock workflow service
- [ ] Integrate GetStream notification service
- [ ] Fix `POST /v1/stream-chat/token` (remove role: 'user')

### **Frontend**
- [x] Create `useCreateChannel` hook
- [x] Create `useIdolChannels` hook
- [x] Update `ChatChannelsProvider`
- [x] Create `CreateChannelModal` UI
- [x] Add floating action button for idols
- [ ] Create `NotificationsChannelListener` component
- [ ] Create `KnockProvider` component
- [ ] Update provider hierarchy in `src/index.tsx`
- [ ] Add Knock constants to config

### **Knock Dashboard**
- [ ] Create workflow: `channel-created`
- [ ] Create workflow: `new-message`
- [ ] Create workflow: `community-joined`
- [ ] Configure FCM/APNS channels
- [ ] Configure email templates

---

## 🚨 Current Status

**Frontend:** ✅ 90% Complete
- Channel management UI done
- Idol features implemented
- Waiting for backend APIs

**Backend:** ⏳ Pending Implementation
- Need channel management endpoints
- Need GetStream webhook handler
- Need Knock integration
- Need to fix token permissions

**Notifications:** ⏳ Ready to Implement
- GetStream notification channel architecture defined
- Knock workflow structure documented
- Frontend listeners ready to build

---

**Last Updated:** 2025-12-22
**Priority:** 🔴 HIGH - Chat blocked until backend implements
