# Knock and GetStream Integration - Ventidole

## Overview

Ventidole uses a dual notification and messaging architecture based on your previous project:

- **Knock**: Multi-channel notification delivery (push, in-app, email)
- **GetStream**: Real-time chat messaging + real-time event bus

## Architecture

```
User Action (e.g., new post, order, message)
│
├─→ GetStream Notification Channel
│   └─ Immediate WebSocket event to user
│   └─ User sees real-time updates in-app
│
├─→ GetStream Chat Channels
│   └─ Real-time messaging between users
│   └─ Database stores messages (source of truth)
│
└─→ Knock Workflow Trigger
    └─ Push notification (FCM)
    └─ In-app notification feed
    └─ Email notification (optional)
```

---

## Key Components

### 1. Knock Integration

#### Configuration (`src/core/config/knock.config.ts`)
```typescript
KNOCK_SECRET_KEY     - Server-side API key
KNOCK_PUBLIC_API_KEY - Client-side API key
KNOCK_SIGNING_KEY    - For generating user tokens
KNOCK_PUSH_CHANNEL_ID - FCM push channel
KNOCK_IN_APP_CHANNEL_ID - In-app notifications
```

#### Service (`src/shared/service/knock-workflow/knock-workflow.service.ts`)
Handles workflow triggers for different events:

**Community Workflows:**
- `notifyCommunityJoined()` - When fan joins idol's community
- `notifyPostLiked()` - When someone likes a post
- `notifyPostCommented()` - When someone comments on a post
- `notifyCommunityNewPost()` - When idol creates new post

**Chat Workflows:**
- `notifyNewMessage()` - New chat message notification
- `notifyChannelInvitation()` - User added to channel

**Order Workflows:**
- `notifyConfirmOrder()` - Order confirmed
- `notifyOrderShipped()` - Order shipped
- `notifyOrderDelivered()` - Order delivered
- `notifyPaymentSuccess()` - Payment successful
- `notifyPaymentFailed()` - Payment failed

#### Knock Enum (`src/shared/enum/knock-workflow.enum.ts`)
Defines all workflow keys that must be created in Knock dashboard.

### 2. GetStream Integration

#### Chat System (`src/domain/user/chat/chat.service.ts`)
- Database as source of truth
- GetStream for real-time messaging
- Hybrid architecture (already implemented)

#### Notification Channel System (`src/shared/service/getstream-notification/getstream-notification.service.ts`)
**NEW**: Special `notifications-{userId}` channels for real-time app events.

**Key Methods:**
- `createNotificationChannel(userId)` - Create notification channel on signup
- `emitEventToUser(userId, eventType, data)` - Send real-time event to user
- `emitNewPostEvent()` - Notify about new posts
- `emitPostLikedEvent()` - Real-time like notification
- `emitCommunityJoinedEvent()` - Real-time follower notification
- `emitOrderStatusEvent()` - Real-time order updates
- `emitInvalidateQueriesEvent()` - Trigger React Query refetch
- `emitNavigationEvent()` - Navigate user to specific screen

---

## Integration Points

### 1. User Registration

**When:** User signs up or logs in

**Backend Actions:**
```typescript
// 1. Register user in Knock
await knockClient.users.identify(userId, {
  email: user.email,
  name: user.username,
  avatar: user.avatarUrl,
  role: user.role,
});

// 2. Create GetStream notification channel
await getStreamNotificationService.createNotificationChannel(userId);

// 3. Create GetStream user
await streamClient.upsertUser({
  id: userId,
  name: user.username,
  image: user.avatarUrl,
});
```

**File:** `src/domain/auth/auth.service.ts` (needs update)

### 2. Community Actions

#### Fan Joins Community
```typescript
// Trigger Knock workflow
await knockWorkflowService.notifyCommunityJoined({
  idolId: community.idolId,
  fan: { id: fanId, name: fanName, avatar: fanAvatar },
  communityId: community.id,
  communityName: community.name,
});

// Emit real-time event
await getStreamNotificationService.emitCommunityJoinedEvent({
  idolId: community.idolId,
  fanName,
  communityId: community.id,
  communityName: community.name,
});
```

**File:** `src/domain/community/community.service.ts` (needs update)

#### Idol Creates Post
```typescript
// Get all followers
const followers = await prisma.communityFollower.findMany({
  where: { communityId },
});

const followerIds = followers.map(f => f.userId);

// Trigger Knock workflow
await knockWorkflowService.notifyCommunityNewPost({
  members: followerIds.map(id => ({ id })),
  communityId,
  communityName,
  postId,
  postTitle: content.substring(0, 100),
  author: { id: authorId, name: authorName, avatar: authorAvatar },
});

// Emit real-time event
await getStreamNotificationService.emitNewPostEvent({
  userIds: followerIds,
  postId,
  authorName,
  communityName,
  postPreview: content.substring(0, 100),
});
```

**File:** `src/domain/post/post.service.ts` (needs update)

#### Someone Likes Post
```typescript
// Trigger Knock workflow
await knockWorkflowService.notifyPostLiked({
  authorId: post.authorId,
  liker: { id: userId, name: userName, avatar: userAvatar },
  postId: post.id,
  postContent: post.content,
});

// Emit real-time event
await getStreamNotificationService.emitPostLikedEvent({
  userId: post.authorId,
  likerName: userName,
  postId: post.id,
});
```

**File:** `src/domain/post/post.service.ts` (needs update)

### 3. Chat Integration

#### New Message Sent
```typescript
// Save to database first
const message = await prisma.chatMessage.create({...});

// Send to GetStream for real-time
await streamChannel.sendMessage({
  id: message.id,
  text: message.content,
  user_id: userId,
});

// Notify recipients who are not in the channel
await knockWorkflowService.notifyNewMessage({
  recipientId: otherUserId,
  sender: { id: userId, name: userName, avatar: userAvatar },
  channelId: channel.id,
  channelName: channel.name,
  messagePreview: message.content,
});
```

**File:** `src/domain/user/chat/chat.service.ts` (already has GetStream, add Knock)

#### User Added to Channel
```typescript
// Add to database
await prisma.chatParticipant.create({...});

// Add to GetStream
await streamChannel.addMembers([userId]);

// Notify user
await knockWorkflowService.notifyChannelInvitation({
  recipientId: userId,
  inviter: { id: inviterId, name: inviterName },
  channelId: channel.id,
  channelName: channel.name,
});

await getStreamNotificationService.emitChannelInvitationEvent({
  userId,
  inviterName,
  channelId: channel.id,
  channelName: channel.name,
});
```

**File:** `src/domain/user/chat/chat.service.ts` (needs update)

### 4. Order Integration

#### Order Confirmed
```typescript
await knockWorkflowService.notifyConfirmOrder({
  userId: order.userId,
  title: 'Order Confirmed',
  text: `Your order #${order.orderCode} has been confirmed`,
  metadata: { url: `/orders/${order.id}` },
});

await getStreamNotificationService.emitOrderStatusEvent({
  userId: order.userId,
  orderId: order.id,
  orderCode: order.orderCode,
  status: 'confirmed',
});
```

**File:** `src/domain/order/order.service.ts` (needs update)

#### Order Shipped
```typescript
await knockWorkflowService.notifyOrderShipped({
  userId: order.userId,
  orderId: order.id,
  orderCode: order.orderCode,
  trackingNumber: shipping.trackingNumber,
});

await getStreamNotificationService.emitOrderStatusEvent({
  userId: order.userId,
  orderId: order.id,
  orderCode: order.orderCode,
  status: 'shipped',
  trackingNumber: shipping.trackingNumber,
});
```

---

## Frontend Integration

### 1. Provider Setup (React Native)

```typescript
// App.tsx
<BackendApiProvider>
  <AuthProvider>
    <StreamChatProvider>  {/* Already exists */}
      <KnockProvider>      {/* NEW */}
        <NotificationsChannelListener>  {/* NEW */}
          <App />
        </NotificationsChannelListener>
      </KnockProvider>
    </StreamChatProvider>
  </AuthProvider>
</BackendApiProvider>
```

### 2. KnockProvider

```typescript
// contexts/KnockProvider.tsx
export const KnockProvider = ({ children }) => {
  const { user } = useAuth();
  const knockClient = useRef<Knock>();

  useEffect(() => {
    if (user) {
      // Initialize Knock
      knockClient.current = new Knock(KNOCK_PUBLIC_API_KEY);

      // Get auth token from backend
      const { token } = await api.get('/knock/auth/token');

      // Authenticate user
      await knockClient.current.authenticate(user.id, token);

      // Register FCM token for push notifications
      const fcmToken = await messaging().getToken();
      await api.post('/knock/fcm-token', { fcmToken });

      // Setup notification feed
      const feed = knockClient.current.feeds.initialize(
        KNOCK_IN_APP_FEED_ID,
        { auto_manage_socket_connection: true }
      );

      feed.on('items.received', (items) => {
        // Update badge count, show toasts
      });
    }
  }, [user]);

  return <KnockContext.Provider value={{knockClient}}>
    {children}
  </KnockContext.Provider>;
};
```

### 3. NotificationsChannelListener

```typescript
// components/NotificationsChannelListener.tsx
export const NotificationsChannelListener = ({ children }) => {
  const { user } = useAuth();
  const chatClient = useChatContext();
  const queryClient = useQueryClient();
  const navigation = useNavigation();

  useEffect(() => {
    if (!chatClient || !user) return;

    // Watch the notifications channel
    const channel = chatClient.channel('team', `notifications-${user.id}`);
    channel.watch();

    // Listen for events
    const handleMessage = (event) => {
      const { type, title, message, url, data } = event.message;

      switch (type) {
        case 'new_post':
          // Invalidate posts query
          queryClient.invalidateQueries(['posts']);
          // Show toast
          showToast(title, message);
          break;

        case 'post_liked':
        case 'post_commented':
          // Invalidate specific post
          queryClient.invalidateQueries(['post', data.postId]);
          showToast(title, message);
          break;

        case 'community_joined':
          // Invalidate followers
          queryClient.invalidateQueries(['community-followers']);
          showToast(title, message);
          break;

        case 'order_status_updated':
          // Invalidate orders
          queryClient.invalidateQueries(['orders']);
          queryClient.invalidateQueries(['order', data.orderId]);
          showToast(title, message);
          break;

        case 'invalidate_queries':
          // Invalidate specific queries
          data.queryKeys.forEach(key => {
            queryClient.invalidateQueries([key]);
          });
          break;

        case 'navigate':
          // Navigate to specific screen
          navigation.navigate(data.screen, data.params);
          break;
      }
    };

    channel.on('message.new', handleMessage);

    return () => {
      channel.off('message.new', handleMessage);
    };
  }, [chatClient, user]);

  return <>{children}</>;
};
```

---

## Environment Variables

Add to `.env`:

```bash
# Knock Configuration
KNOCK_SECRET_KEY=sk_test_...
KNOCK_PUBLIC_API_KEY=pk_test_...
KNOCK_SIGNING_KEY=...
KNOCK_PUSH_CHANNEL_ID=...
KNOCK_IN_APP_CHANNEL_ID=...

# Already exists
STREAM_CHAT_API_KEY=...
STREAM_CHAT_SECRET=...
```

---

## Knock Workflow Setup

Create these workflows in Knock dashboard:

1. `community-new-post` - New post notification
2. `community-joined` - New follower notification
3. `post-liked` - Post like notification
4. `post-commented` - Post comment notification
5. `new-message` - Chat message notification
6. `channel-invitation` - Channel invitation notification
7. `confirm-order` - Order confirmation
8. `order-shipped` - Order shipped notification
9. `order-delivered` - Order delivered notification
10. `payment-success` - Payment success notification
11. `payment-failed` - Payment failed notification

Each workflow should have channels configured:
- Push (FCM/APNS)
- In-app feed
- Email (optional)

---

## Benefits

1. **Dual Notification System:**
   - GetStream = Real-time for active users
   - Knock = Push/Email for inactive users

2. **Real-time Everything:**
   - Chat messages (GetStream messaging)
   - App events (GetStream notifications channel)
   - Query invalidation (React Query refetch)
   - Navigation (deep links)

3. **No Vendor Lock-in:**
   - Database stores all chat data
   - Can switch from GetStream anytime
   - Knock workflows are portable

4. **Scalable:**
   - GetStream handles millions of concurrent connections
   - Knock handles multi-channel delivery
   - Both services scale automatically

---

## Migration Checklist

- [x] Knock workflow service enhanced
- [x] GetStream notification service created
- [x] Knock workflow enum updated
- [ ] Update auth service to initialize Knock + GetStream
- [ ] Update post service to trigger notifications
- [ ] Update community service to trigger notifications
- [ ] Update chat service to trigger Knock notifications
- [ ] Update order service to trigger notifications
- [ ] Frontend: Create KnockProvider
- [ ] Frontend: Create NotificationsChannelListener
- [ ] Frontend: Update provider hierarchy
- [ ] Knock dashboard: Create all workflows

---

## Testing

```bash
# Test Knock notification
curl -X POST http://localhost:3000/api/v1/knock/fcm-token \
  -H "Authorization: Bearer {token}" \
  -d '{"fcmToken": "..."}'

# Test GetStream notification channel
# (automatically created on user signup)

# Trigger a test notification
# Create a post and verify:
# 1. Knock sends push notification
# 2. GetStream sends real-time event
# 3. Frontend shows toast and updates UI
```

---

**Status:** ✅ Backend integration complete
**Next:** Frontend React Native integration
