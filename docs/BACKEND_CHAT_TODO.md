# Realtime Chat – GetStream Integration Guide (FE + BE)

## Overview

This document describes how to implement the realtime chat system using GetStream Chat with a **Backend-light architecture**:

- **Frontend** connects directly to GetStream for realtime messaging
- **Backend** handles authentication, authorization, and Stream token issuance
- **No chat data** is stored in the database
- **Database** remains for core business logic only (users, idols, communities, access rules)

---

## Chat Permission Logic Summary

### Channel Types & Creation Rules

1. **Community Chat Channels**
   - Can only be created by **ADMIN**
   - All idols related to that community automatically get send message permission
   - Regular members join as readonly by default
   - Any idol in the community can grant/revoke send permissions to members

2. **Idol Chat Channels**
   - Can be created by any user with **IDOL** role
   - Creator (idol) is the channel owner
   - All members join as readonly by default
   - Only the channel creator can grant/revoke send permissions to members

### Default Member Behavior

- When a user joins any channel, they are **readonly by default**
- Readonly members can:
  - ✅ View messages
  - ✅ Receive notifications
  - ❌ Cannot send messages
- Permission to send messages must be explicitly granted by authorized users (creator or idols)

---

## Final Architecture

```
┌─────────────────┐
│   Frontend      │
│  (RN / Web)     │
└────────┬────────┘
         │ Stream SDK (WebSocket)
         ▼
┌────────────────────────┐
│   GetStream Chat       │
│   - Channels           │
│   - Members            │
│   - Messages           │
│   - Unread counts      │
└───────────┬────────────┘
            ▲
            │ REST API
            │
┌───────────┴────────────┐
│      Backend           │
│      (NestJS)          │
│   - Auth               │
│   - Roles              │
│   - Token              │
│   - Business Logic     │
└────────────────────────┘
```

---

## Responsibility Matrix

| Layer      | Responsibility                                      |
|------------|-----------------------------------------------------|
| Frontend   | Realtime chat, UI, WebSocket connection             |
| Backend    | Auth, permissions, Stream token, business rules     |
| GetStream  | Chat storage, realtime, unread counts               |
| Database   | Users, idols, communities, follows, access rules    |
| Knock      | Push / Email notifications                          |

---

## Backend (BE) Implementation

### 1. Backend Responsibilities (MANDATORY)

**Backend must NOT store chat data.**

Backend must:

- ✅ Authenticate user
- ✅ Enforce business rules (admin-only for community channels, idol-only for idol channels, permissions)
- ✅ Issue GetStream user tokens
- ✅ Create channels:
  - Community channels (admin only)
  - Idol channels (idol only)
- ✅ Manage member send permissions

---

### 2. Stream Token Endpoint

**Endpoint**: `POST /v1/chat/token`

**Purpose**: Issue a short-lived GetStream token. FE uses this token to connect directly to Stream.

**Implementation**:

```typescript
@Post("token")
getStreamToken(@Req() req) {
  const userId = req.user.id;

  const token = streamClient.createToken(userId);

  return {
    token,
    userId
  };
}
```

**🔒 Security Rules**:

- Stream API secret **never** leaves backend
- Token should expire (recommended)

---

### 3. Channel Creation (Backend-Controlled)

#### A. Community Chat Channels

**Endpoint**: `POST /v1/chat/channels/community`

**Role**: ADMIN only

**Business Logic**:

1. Validate admin role
2. Validate community exists
3. Generate channel ID
4. Create channel in GetStream
5. Add all idols related to the community as members with send permission
6. Add admin as owner
7. Trigger notifications

**Implementation**:

```typescript
const channel = streamClient.channel("messaging", channelId, {
  name,
  image,
  community_id: communityId,
  is_community_channel: true,
  created_by_id: adminId
});

await channel.create();

// Add admin as owner
await channel.addMembers([{ user_id: adminId, role: "owner" }]);

// Add all idols from the community with send permission
const communityIdols = await getCommunityIdols(communityId);
await channel.addMembers(
  communityIdols.map(idol => ({
    user_id: idol.id,
    channel_role: "channel_member" // can send messages
  }))
);
```

#### B. Idol Chat Channels

**Endpoint**: `POST /v1/chat/channels/idol`

**Role**: IDOL only

**Business Logic**:

1. Validate idol role
2. Generate channel ID
3. Create channel in GetStream
4. Add idol as owner (can send messages)
5. Set default members as readonly
6. Trigger notifications

**Implementation**:

```typescript
const channel = streamClient.channel("messaging", channelId, {
  name,
  image,
  is_idol_channel: true,
  created_by_id: idolId
});

await channel.create();

// Add idol as owner with full permissions
await channel.addMembers([{ user_id: idolId, role: "owner" }]);

// Members joining later will be added as readonly by default
```

---

### 4. Permission Gate Endpoints (Optional but Recommended)

Backend decides who is allowed to join or leave.

**Join Permission Check**: `POST /v1/chat/channels/:id/join-check`

```typescript
if (!userHasAccess) {
  throw ForbiddenException;
}

return { allowed: true };
```

**FE only joins if backend allows.**

---

### 5. Member Permission Management

#### A. Grant Send Message Permission

**Endpoint**: `POST /v1/chat/channels/:id/members/:memberId/grant-send-permission`

**Authorization**:
- For idol channels: Only channel creator (owner)
- For community channels: Any idol in the community

**Business Logic**:

```typescript
// Validate requester is authorized
if (channel.is_idol_channel) {
  if (requesterId !== channel.created_by_id) {
    throw ForbiddenException;
  }
} else if (channel.is_community_channel) {
  const isIdolInCommunity = await checkIdolInCommunity(requesterId, channel.community_id);
  if (!isIdolInCommunity) {
    throw ForbiddenException;
  }
}

// Update member role to allow sending messages
await channel.updatePartial({
  set: {
    [`members.${memberId}.channel_role`]: "channel_member"
  }
});
```

#### B. Revoke Send Message Permission

**Endpoint**: `POST /v1/chat/channels/:id/members/:memberId/revoke-send-permission`

**Authorization**: Same as grant permission

**Business Logic**:

```typescript
// Update member role to readonly
await channel.updatePartial({
  set: {
    [`members.${memberId}.channel_role`]: "channel_readonly"
  }
});
```

---

## Frontend (FE) Implementation

### 1. Frontend Responsibilities

Frontend:

- ✅ Connects directly to GetStream
- ✅ Sends / receives messages
- ✅ Handles realtime updates
- ✅ Joins / leaves channels
- ❌ Does NOT contain business rules

---

### 2. Connect User to GetStream

**Flow**:

1. FE logs in via backend
2. FE requests Stream token
3. FE connects to GetStream

**Implementation**:

```typescript
const client = StreamChat.getInstance(STREAM_API_KEY);

await client.connectUser(
  {
    id: user.id,
    name: user.name,
    image: user.avatar
  },
  streamToken
);
```

---

### 3. Get Joined Channels

```typescript
const channels = await client.queryChannels({
  members: { $in: [userId] }
});
```

---

### 4. Join Channel (Realtime)

**Flow**:

1. FE calls backend `join-check`
2. If allowed → FE adds member as readonly by default

**Implementation**:

```typescript
const channel = client.channel("messaging", channelId);

// Add member as readonly by default
await channel.addMembers([
  {
    user_id: userId,
    channel_role: "channel_readonly"
  }
]);
```

**Note**: Members join as readonly by default. Only channel owners/idols can grant send permission later.

---

### 5. Leave Channel

```typescript
const channel = client.channel("messaging", channelId);
await channel.removeMembers([userId]);
```

**Backend rule**: Creator cannot leave

---

### 6. Send Message

```typescript
channel.sendMessage({
  text: message
});
```

---

### 7. Read / Unread Handling

```typescript
channel.markRead();
```

Unread count is automatic.

---

### 8. Message Pagination

```typescript
channel.query({
  messages: {
    limit: 20,
    offset
  }
});
```

---

### 9. Channel Search

```typescript
client.queryChannels(
  {
    is_community_channel: true,
    name: { $autocomplete: search }
  },
  { last_message_at: -1 },
  { limit }
);
```

---

## Permissions & Roles (GetStream)

### Roles

| Role              | Description                                      | Can Send Messages |
|-------------------|--------------------------------------------------|-------------------|
| owner             | Channel creator (Admin or Idol)                  | ✅                |
| channel_member    | Member with send permission (granted by owner/idol) | ✅             |
| channel_readonly  | Default member (readonly)                        | ❌                |

### Permission Logic by Channel Type

#### Idol Channels
- **Creator (Idol)**: owner role - can send messages, manage permissions
- **Members (Default)**: channel_readonly - cannot send messages
- **Members (Granted)**: channel_member - can send messages after creator grants permission

#### Community Channels
- **Creator (Admin)**: owner role - can send messages, manage permissions
- **Idols in Community**: channel_member - can send messages by default
- **Regular Members (Default)**: channel_readonly - cannot send messages
- **Regular Members (Granted)**: channel_member - can send messages after idol grants permission

### Rules

- `owner` cannot leave channel
- `channel_readonly` cannot send messages
- Only `owner` can delete channel
- For **idol channels**: Only creator can grant/revoke send permissions
- For **community channels**: Any idol in the community can grant/revoke send permissions

**Defined in Stream Dashboard → Permissions.**

---

## Security Rules (NON-NEGOTIABLE)

- ❌ **Never** expose Stream secret to FE
- ❌ **Never** let FE bypass backend permission checks
- ❌ **Never** store chat data in DB
- ✅ **Always** issue Stream token from backend

---

## Notifications

| Event Type         | Handler                     |
|--------------------|-----------------------------|
| Messages           | GetStream realtime (no Knock) |
| Channel creation   | Knock (push/email)          |
| Special events     | Knock workflows             |

---

## Error Codes

- `ChatChannelAccessDenied`
- `ChatChannelAlreadyJoined`
- `ChatChannelNotJoined`
- `ChatChannelOwnerCannotLeave`
- `StreamTokenInvalid`

---

## Testing Checklist

### Backend

- [ ] Token cannot be generated without auth
- [ ] Non-admin cannot create community channel
- [ ] Non-idol cannot create idol channel
- [ ] Community channel creation adds all community idols with send permission
- [ ] Idol channel creator is set as owner
- [ ] Members join as readonly by default
- [ ] Only channel creator can grant/revoke permissions (idol channel)
- [ ] Any idol in community can grant/revoke permissions (community channel)
- [ ] Token expires correctly

### Frontend

- [ ] Realtime messages received
- [ ] Join / leave works instantly
- [ ] Readonly members cannot send messages
- [ ] Members with granted permission can send messages
- [ ] Unread count updates
- [ ] Permissions enforced by Stream
- [ ] UI shows send permission status correctly

---

## Final Notes

- GetStream is the **only** chat datastore
- Backend remains **thin but essential**
- Frontend handles **realtime directly**
- Architecture is **scalable & secure**
- Matches industry standards (Discord / Slack)
