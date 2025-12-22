# Backend Channel Management - TODO

## 🎯 Overview

Idols can create channels and manage community channels. Backend stores channel metadata in database while GetStream handles real-time messaging.

---

## 📋 Backend Requirements

### **Architecture:**
- **Backend Database**: Stores channel metadata, ownership, community associations
- **GetStream**: Handles real-time messaging, message storage, real-time events
- **Sync**: When channel created in backend → also create in GetStream

---

## 🗄️ Database Schema

### **1. channels Table**

```sql
CREATE TABLE channels (
  id VARCHAR(255) PRIMARY KEY,           -- Same ID used in GetStream
  type VARCHAR(50) NOT NULL DEFAULT 'messaging',
  name VARCHAR(255),
  image VARCHAR(500),
  description TEXT,

  -- Ownership
  creator_id VARCHAR(255) NOT NULL,      -- User who created the channel
  owner_type VARCHAR(50) NOT NULL,       -- 'IDOL' or 'SYSTEM'

  -- Community association
  community_id VARCHAR(255),             -- Link to community/artist
  is_community_channel BOOLEAN DEFAULT false,

  -- Metadata
  member_count INT DEFAULT 0,
  last_message_at TIMESTAMP,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_creator (creator_id),
  INDEX idx_community (community_id),
  INDEX idx_type (type),

  -- Foreign keys
  FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (community_id) REFERENCES communities(id) ON DELETE SET NULL
);
```

### **2. channel_members Table**

```sql
CREATE TABLE channel_members (
  id VARCHAR(255) PRIMARY KEY,
  channel_id VARCHAR(255) NOT NULL,
  user_id VARCHAR(255) NOT NULL,

  -- Role in channel
  role VARCHAR(50) DEFAULT 'member',     -- 'owner', 'moderator', 'member'

  -- Join info
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  invited_by VARCHAR(255),

  -- Status
  is_active BOOLEAN DEFAULT true,
  left_at TIMESTAMP NULL,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Constraints
  UNIQUE KEY unique_channel_member (channel_id, user_id),

  -- Indexes
  INDEX idx_channel (channel_id),
  INDEX idx_user (user_id),

  -- Foreign keys
  FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
```

### **3. communities Table** (if not exists)

```sql
CREATE TABLE communities (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image VARCHAR(500),

  -- Association with idol
  idol_id VARCHAR(255) NOT NULL,

  -- Stats
  member_count INT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Indexes
  INDEX idx_idol (idol_id),

  -- Foreign keys
  FOREIGN KEY (idol_id) REFERENCES users(id) ON DELETE CASCADE
);
```

---

## 🔌 API Endpoints to Implement

### **1. Create Channel** ⭐ HIGH PRIORITY

**Endpoint:** `POST /v1/user/chat/channels`

**Auth:** Required (IDOL only)

**Request Body:**
```typescript
{
  name: string;              // Required
  description?: string;
  image?: string;            // URL
  type?: 'messaging' | 'team' | 'livestream';  // Default: 'messaging'
  communityId?: string;      // Optional: associate with community
  isCommunityChannel?: boolean;  // Default: false
  memberIds?: string[];      // Optional: initial members
}
```

**Response:**
```typescript
{
  id: string;
  type: string;
  name: string;
  description: string;
  image: string;
  creatorId: string;
  communityId: string | null;
  isCommunityChannel: boolean;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}
```

**Implementation Steps:**
1. Validate user is IDOL role
2. Generate channel ID (UUID)
3. Save channel to database
4. Create channel in GetStream with same ID
5. Add creator as owner in GetStream
6. Add initial members if provided
7. Return channel data

**Backend Code Example:**
```typescript
// POST /v1/user/chat/channels
export async function createChannel(req: Request, res: Response) {
  const userId = req.user.id;  // From auth middleware
  const { name, description, image, type, communityId, isCommunityChannel, memberIds } = req.body;

  // 1. Check user is IDOL
  const user = await db.users.findById(userId);
  if (user.role !== 'IDOL') {
    return res.status(403).json({ error: 'Only idols can create channels' });
  }

  // 2. Generate channel ID
  const channelId = generateUUID();

  // 3. Save to database
  const channel = await db.channels.create({
    id: channelId,
    type: type || 'messaging',
    name,
    description,
    image,
    creator_id: userId,
    owner_type: 'IDOL',
    community_id: communityId || null,
    is_community_channel: isCommunityChannel || false,
    member_count: 1,  // Creator
    created_at: new Date(),
    updated_at: new Date(),
  });

  // 4. Add creator as member
  await db.channel_members.create({
    id: generateUUID(),
    channel_id: channelId,
    user_id: userId,
    role: 'owner',
    joined_at: new Date(),
  });

  // 5. Create in GetStream
  const streamClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  const streamChannel = streamClient.channel(type || 'messaging', channelId, {
    name,
    image,
    description,
    created_by_id: userId,
    community_id: communityId,
  });

  await streamChannel.create();

  // 6. Add creator as owner in GetStream
  await streamChannel.addMembers([userId], {
    text: `${user.name} created this channel`,
  });

  // 7. Add initial members if provided
  if (memberIds && memberIds.length > 0) {
    await streamChannel.addMembers(memberIds);

    // Add to database
    for (const memberId of memberIds) {
      await db.channel_members.create({
        id: generateUUID(),
        channel_id: channelId,
        user_id: memberId,
        role: 'member',
        invited_by: userId,
        joined_at: new Date(),
      });
    }

    // Update member count
    await db.channels.update(
      { id: channelId },
      { member_count: 1 + memberIds.length }
    );
  }

  return res.json({
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
  });
}
```

---

### **2. Get My Channels** ⭐ HIGH PRIORITY

**Endpoint:** `GET /v1/user/chat/my-channels`

**Auth:** Required (IDOL only)

**Query Parameters:**
```typescript
{
  page?: number;       // Default: 1
  limit?: number;      // Default: 20
  includeCommunity?: boolean;  // Default: true
}
```

**Response:**
```typescript
{
  data: [
    {
      id: string;
      type: string;
      name: string;
      description: string;
      image: string;
      creatorId: string;
      communityId: string | null;
      isCommunityChannel: boolean;
      memberCount: number;
      unreadCount: number;        // From GetStream
      lastMessage: {              // From GetStream
        id: string;
        text: string;
        createdAt: string;
        user: {
          id: string;
          name: string;
        };
      } | null;
      createdAt: string;
      updatedAt: string;
    }
  ];
  paging: {
    page: number;
    limit: number;
    totalPages: number;
    totalItems: number;
  };
}
```

**Implementation Steps:**
1. Validate user is IDOL
2. Get user's communities
3. Query channels where:
   - User is creator OR
   - Channel is community channel linked to user's communities
4. Fetch real-time data from GetStream (unread count, last message)
5. Merge database + GetStream data
6. Return paginated results

**Backend Code Example:**
```typescript
// GET /v1/user/chat/my-channels
export async function getMyChannels(req: Request, res: Response) {
  const userId = req.user.id;
  const { page = 1, limit = 20, includeCommunity = true } = req.query;

  // 1. Check user is IDOL
  const user = await db.users.findById(userId);
  if (user.role !== 'IDOL') {
    return res.status(403).json({ error: 'Only idols can access this endpoint' });
  }

  // 2. Get user's communities
  const communities = await db.communities.findMany({
    where: { idol_id: userId },
    select: { id: true },
  });
  const communityIds = communities.map(c => c.id);

  // 3. Build query
  const whereConditions = [
    { creator_id: userId },  // Channels created by idol
  ];

  if (includeCommunity && communityIds.length > 0) {
    whereConditions.push({
      is_community_channel: true,
      community_id: { in: communityIds },
    });
  }

  // 4. Query channels
  const offset = (page - 1) * limit;
  const [channels, totalCount] = await Promise.all([
    db.channels.findMany({
      where: { OR: whereConditions },
      orderBy: { updated_at: 'desc' },
      skip: offset,
      take: limit,
    }),
    db.channels.count({
      where: { OR: whereConditions },
    }),
  ]);

  // 5. Fetch GetStream data for real-time info
  const streamClient = StreamChat.getInstance(
    process.env.STREAM_API_KEY!,
    process.env.STREAM_API_SECRET!
  );

  const channelIds = channels.map(ch => ch.id);
  const streamChannels = await streamClient.queryChannels(
    { id: { $in: channelIds } },
    {},
    { state: true }
  );

  // Create map for quick lookup
  const streamMap = new Map(streamChannels.map(ch => [ch.id, ch]));

  // 6. Merge database + GetStream data
  const result = channels.map(dbChannel => {
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

  return res.json({
    data: result,
    paging: {
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(totalCount / limit),
      totalItems: totalCount,
    },
  });
}
```

---

### **3. Get Joined Channels** (Already Implemented?)

**Endpoint:** `GET /v1/user/chat/joined-channels`

**Auth:** Required

**Updates Needed:**
- Ensure it returns channels user is member of
- Include community channels
- Merge with GetStream data for real-time info

---

### **4. Add Members to Channel** (Optional - Future)

**Endpoint:** `POST /v1/user/chat/channels/{channelId}/members`

**Auth:** Required (channel owner/moderator)

**Request Body:**
```typescript
{
  memberIds: string[];
}
```

**Implementation:**
1. Check user has permission (owner/moderator)
2. Add members to database
3. Add members to GetStream channel
4. Update member count
5. Return success

---

### **5. Remove Member from Channel** (Optional - Future)

**Endpoint:** `DELETE /v1/user/chat/channels/{channelId}/members/{memberId}`

---

### **6. Delete Channel** (Optional - Future)

**Endpoint:** `DELETE /v1/user/chat/channels/{channelId}`

---

## 🔄 Sync Strategy

### **Database → GetStream:**
- When channel created in DB → Create in GetStream
- When member added in DB → Add to GetStream
- When channel deleted in DB → Delete from GetStream

### **GetStream → Database:**
- Webhook: `message.new` → Update `last_message_at` in DB
- Webhook: `member.added` → Update member count
- Webhook: `member.removed` → Update member count

---

## 🎯 Frontend Integration

### **Flow:**
1. Frontend calls `POST /v1/user/chat/channels` to create channel
2. Backend creates in DB + GetStream
3. Frontend calls `GET /v1/user/chat/my-channels` to list channels
4. Frontend displays channel list
5. User clicks channel → Frontend uses GetStream for real-time messaging
6. GetStream handles all message display/sending

---

## ✅ Backend Checklist

### **High Priority (MVP):**
- [ ] Create `channels` table
- [ ] Create `channel_members` table
- [ ] Implement `POST /v1/user/chat/channels` (create channel)
- [ ] Implement `GET /v1/user/chat/my-channels` (list idol's channels)
- [ ] Update `GET /v1/user/chat/joined-channels` (include community channels)
- [ ] Fix `POST /v1/stream-chat/token` (remove role: 'user')

### **Medium Priority:**
- [ ] Implement `POST /v1/user/chat/channels/{channelId}/members` (add members)
- [ ] Implement webhook handler for GetStream events
- [ ] Add database indexes for performance
- [ ] Add validation for channel names/descriptions

### **Low Priority (Future):**
- [ ] Channel search endpoint
- [ ] Channel analytics
- [ ] Member management endpoints
- [ ] Channel settings/permissions

---

## 📝 Notes

### **Channel ID Generation:**
Use UUID v4 for channel IDs to ensure uniqueness across DB and GetStream.

### **Community Channels:**
- Created by idol
- Linked to specific community
- All community members auto-join
- Displayed in "my-channels" for idol
- Displayed in "joined-channels" for fans

### **Permissions:**
- Only IDOL can create channels
- Channel owner can manage members
- All members can send messages (controlled by GetStream)

---

**Last Updated:** 2025-12-22
**Status:** 📋 Backend TODO - Implementation Required
**Priority:** 🔴 HIGH - Required for idol channel management
