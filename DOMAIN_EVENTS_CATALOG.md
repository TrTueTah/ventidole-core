# Domain Events Catalog

This document catalogues all domain events in the ventidole-core application. Domain events represent significant business occurrences and enable loose coupling between bounded contexts.

## Event Flow Architecture

```
Domain Service (publishes event)
    ↓
EventBus (distributes)
    ↓
Event Handlers (in same or different domains)
    ↓
Side Effects (notifications, integrations, etc.)
```

---

## Identity Domain Events

### UserRegisteredEvent
**Published by:** `AuthService.signUp()`
**When:** New user completes registration
**Data:**
- userId: string
- email: string
- username: string
- avatarUrl: string | null
- role: Role

**Consumed by:**
- Messaging Domain → Create user in GetStream Chat
- Notification Domain → Register user in Knock, set up preferences

**Status:** 🟡 Planned (Phase 3)

---

### UserProfileUpdatedEvent
**Published by:** `ProfileService.updateProfile()`
**When:** User updates their profile information
**Data:**
- userId: string
- changes: Partial<{ username, avatarUrl, bio, status }>

**Consumed by:**
- Messaging Domain → Update user in GetStream Chat
- Notification Domain → Update user in Knock

**Status:** 🔴 Not Implemented

---

### UserRoleChangedEvent
**Published by:** `ProfileService.changeRole()` (admin operation)
**When:** User role is upgraded (Fan → Idol)
**Data:**
- userId: string
- oldRole: Role
- newRole: Role

**Consumed by:**
- Community Domain → May grant additional permissions
- Messaging Domain → Update channel permissions

**Status:** 🔴 Not Implemented

---

## Content Domain Events

### PostCreatedEvent
**Published by:** `PostService.createPost()`
**When:** New post is published
**Data:**
- postId: string
- authorId: string
- communityId: string | null
- content: string
- mediaUrls: string[] | null

**Consumed by:**
- Notification Domain → Notify community followers

**Status:** 🟡 Planned (Phase 2)

---

### PostLikedEvent
**Published by:** `PostService.likePost()`
**When:** User likes a post
**Data:**
- postId: string
- likedBy: string (userId)
- authorId: string

**Consumed by:**
- Notification Domain → Notify post author

**Status:** 🟡 Planned (Phase 2)

---

### CommentAddedEvent
**Published by:** `CommentService.addComment()`
**When:** User comments on a post
**Data:**
- commentId: string
- postId: string
- authorId: string (post author)
- commenterId: string

**Consumed by:**
- Notification Domain → Notify post author

**Status:** 🔴 Not Implemented

---

### PostReportedEvent
**Published by:** `PostService.reportPost()`
**When:** User reports inappropriate content
**Data:**
- reportId: string
- postId: string
- reportedBy: string
- reason: string

**Consumed by:**
- Admin Notification → Alert moderators

**Status:** 🔴 Not Implemented

---

## Community Domain Events

### CommunityJoinedEvent
**Published by:** `CommunityService.joinCommunity()`
**When:** User follows a community
**Data:**
- userId: string
- communityId: string
- communityName: string

**Consumed by:**
- Messaging Domain → Add user to community channels
- Notification Domain → Notify community idols

**Status:** 🟡 Planned (Phase 5)

---

### CommunityLeftEvent
**Published by:** `CommunityService.leaveCommunity()`
**When:** User unfollows a community
**Data:**
- userId: string
- communityId: string

**Consumed by:**
- Messaging Domain → Remove user from community channels

**Status:** 🔴 Not Implemented

---

### CommunityCreatedEvent
**Published by:** `AdminCommunityService.createCommunity()`
**When:** Admin creates a new community
**Data:**
- communityId: string
- name: string
- createdBy: string

**Consumed by:**
- Messaging Domain → May create default community channel

**Status:** 🔴 Not Implemented

---

## Commerce Domain Events

### OrderConfirmedEvent
**Published by:** `OrderService.confirmOrder()`
**When:** User places an order
**Data:**
- orderId: string
- userId: string
- items: OrderItem[]
- totalAmount: number
- paymentMethod: 'COD' | 'CREDIT'

**Consumed by:**
- Notification Domain → Send order confirmation

**Status:** 🟡 Planned (Phase 3)

---

### PaymentCompletedEvent
**Published by:** `OrderService.handlePaymentSuccess()`
**When:** Payment gateway confirms payment
**Data:**
- orderId: string
- transactionId: string
- amount: number
- paymentMethod: string

**Consumed by:**
- Notification Domain → Send payment receipt
- Membership Domain → Activate subscription (if applicable)

**Status:** 🟡 Planned (Phase 3)

---

### PaymentFailedEvent
**Published by:** `OrderService.handlePaymentFailure()`
**When:** Payment fails
**Data:**
- orderId: string
- userId: string
- reason: string

**Consumed by:**
- Notification Domain → Alert user of failure
- Membership Domain → Mark subscription as past due

**Status:** 🔴 Not Implemented

---

### OrderShippedEvent
**Published by:** `OrderService.updateOrderStatus()` (admin)
**When:** Order is shipped
**Data:**
- orderId: string
- userId: string
- trackingNumber: string

**Consumed by:**
- Notification Domain → Send shipping notification

**Status:** 🔴 Not Implemented

---

## Messaging Domain Events

### ChannelCreatedEvent
**Published by:** `ChannelService.createIdolChannel()` or `createCommunityChannel()`
**When:** New chat channel is created
**Data:**
- channelId: string
- channelType: 'idol' | 'community'
- createdBy: string

**Consumed by:**
- Notification Domain → May notify relevant users

**Status:** 🟡 Planned (Phase 2)

---

### MessagePermissionGrantedEvent
**Published by:** `ChannelService.grantSendPermission()`
**When:** User given permission to send messages
**Data:**
- channelId: string
- userId: string
- grantedBy: string

**Consumed by:**
- Notification Domain → Notify user of new permission

**Status:** 🔴 Not Implemented

---

### ChannelMemberAddedEvent
**Published by:** `ChannelService.addMembers()`
**When:** User added to channel
**Data:**
- channelId: string
- userId: string
- addedBy: string

**Consumed by:**
- Notification Domain → Welcome notification

**Status:** 🔴 Not Implemented

---

## Notification Domain Events

### NotificationSentEvent
**Published by:** `NotificationDispatchService.send()`
**When:** Notification successfully delivered
**Data:**
- notificationId: string
- userId: string
- channel: 'email' | 'push' | 'in_app'
- workflowKey: string

**Consumed by:**
- Analytics → Track notification metrics

**Status:** 🔴 Not Implemented

---

### NotificationFailedEvent
**Published by:** `NotificationDispatchService.send()`
**When:** Notification delivery fails
**Data:**
- notificationId: string
- userId: string
- reason: string

**Consumed by:**
- Monitoring → Alert on high failure rates

**Status:** 🔴 Not Implemented

---

## Membership Domain Events

### SubscriptionCreatedEvent
**Published by:** `SubscriptionService.createSubscription()`
**When:** User subscribes to a tier
**Data:**
- subscriptionId: string
- userId: string
- tierId: string
- tierName: string
- startDate: Date

**Consumed by:**
- Notification Domain → Welcome to premium email

**Status:** 🟡 Planned (Phase 5)

---

### SubscriptionCancelledEvent
**Published by:** `SubscriptionService.cancelSubscription()`
**When:** User cancels subscription
**Data:**
- subscriptionId: string
- userId: string
- endDate: Date

**Consumed by:**
- Notification Domain → Cancellation confirmation

**Status:** 🔴 Not Implemented

---

### TierUpgradedEvent
**Published by:** `SubscriptionService.upgradeSubscription()`
**When:** User upgrades to higher tier
**Data:**
- subscriptionId: string
- userId: string
- oldTier: string
- newTier: string

**Consumed by:**
- Notification Domain → Congratulations email

**Status:** 🔴 Not Implemented

---

## Event Status Legend

- ✅ **Implemented** - Event is live in production
- 🟡 **Planned** - Will be implemented in current refactor
- 🔴 **Not Implemented** - Future enhancement

---

## Event Naming Conventions

1. **Past Tense** - Events describe something that already happened
   - ✅ `UserRegisteredEvent`
   - ❌ `RegisterUserEvent`

2. **Domain Prefix** - Event name includes domain context
   - ✅ `PostCreatedEvent` (clear it's about posts)
   - ❌ `CreatedEvent` (ambiguous)

3. **Specific Action** - Event describes specific business event
   - ✅ `PaymentCompletedEvent`
   - ❌ `PaymentEvent` (too generic)

---

## Event Handler Guidelines

1. **Idempotent** - Handlers must handle duplicate events gracefully
2. **Async** - Handlers execute off the critical path (non-blocking)
3. **Isolated** - Handler failures don't affect event publisher
4. **Logged** - All handler executions logged for debugging
5. **Retryable** - Use queue (BullMQ) for persistent retry logic

---

## Migration Phases

**Phase 1:** Event infrastructure ✅ (Complete)
- EventBus
- DomainEvent base class
- IEventHandler interface

**Phase 2:** Post events (Week 2)
- PostCreatedEvent
- PostLikedEvent

**Phase 3:** Auth & Order events (Week 2)
- UserRegisteredEvent
- OrderConfirmedEvent
- PaymentCompletedEvent

**Phase 5:** Community events (Week 3-4)
- CommunityJoinedEvent

**Phase 5:** Membership events (Week 6-7)
- SubscriptionCreatedEvent

**Future:** Remaining events
- All other events marked 🔴
