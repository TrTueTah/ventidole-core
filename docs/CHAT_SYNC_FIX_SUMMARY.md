# Chat Data Sync Fix - Summary

## 🔍 Problem Identified

The channel IDs in the database and GetStream were not matching:
- **Database**: Auto-generated UUIDs (e.g., `df6d9ca5-cb66-4f66-971f-b0a2c9f1f6c0`)
- **GetStream**: Prefixed IDs (e.g., `community_df6d9ca5-cb66-4f66-971f-b0a2c9f1f6c0`)

This caused the backend to query GetStream with database channel IDs and get **NO results**, resulting in:
- ❌ No last messages displayed
- ❌ No unread counts
- ❌ No real-time data merged

## ✅ Solution Implemented

### 1. **Fixed Seed Script** (`scripts/seed-mock-data.ts`)

Updated to create channels in **BOTH database AND GetStream** with **matching IDs**:

```typescript
// Generate a unique channel ID that will be used in BOTH database and GetStream
const channelId = `community_${community.id}`;

// 1. Create channel in DATABASE first
await prisma.chatChannel.create({
  data: {
    id: channelId, // ← Same ID as GetStream!
    type: 'messaging',
    name: `${community.name} Community`,
    // ... other fields
  },
});

// 2. Create channel in GetStream with the SAME ID
const streamChannel = streamChatClient.channel('messaging', channelId, { ... });
await streamChannel.create();
```

### 2. **Created Participants in Database**

The old script only created participants in GetStream. Now it creates them in **both places**:

```typescript
// 1. Add participants to DATABASE
await prisma.chatParticipant.createMany({
  data: participantData,
});

// 2. Add members to GetStream
await streamChannel.addMembers(batch);
```

### 3. **Enhanced GetStream Query in Backend**

Updated the backend service to properly query GetStream with correct options:

```typescript
const streamChannels = await streamChatClient.queryChannels(
  {
    id: { $in: channelIds },
    members: { $in: [userId] }  // Filter by user
  },
  [{ last_message_at: -1 }],
  {
    state: true,
    watch: true,
    presence: false,
    limit: 30,
    messages: { limit: 1 }  // ← CRITICAL: Get messages!
  },
);
```

### 4. **Fixed Message Data Extraction**

Properly extract messages from GetStream state:

```typescript
// Get last message from GetStream state
const messages = streamCh?.state?.messages || [];
const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;

// Proper date handling
lastMessageAt: lastMsg?.created_at
  ? new Date(lastMsg.created_at).toISOString()
  : undefined,
```

### 5. **Created Cleanup Script**

Added `scripts/cleanup-stream-data.ts` to delete old GetStream channels before reseeding.

### 6. **Split Seed Scripts for Reliability**

Separated seeding into two independent scripts to prevent sync issues:
- **`seed-mock-data.ts`**: Only creates database records (users, communities, channels, participants)
- **`seed-getstream.ts`**: Reads from database and syncs to GetStream

**Why?** Database connections can drop during long-running operations, causing partial syncs. By separating them:
- If DB connection fails, only database seeding needs to be re-run
- If GetStream API fails, only GetStream sync needs to be re-run
- Each script can be run independently for testing or recovery

## 🚀 How to Use

The seeding process is now split into two separate scripts for better reliability:

### Step 1: Clean up old GetStream channels (optional)
```bash
npx tsx scripts/cleanup-stream-data.ts
```

### Step 2: Seed the database
```bash
npx tsx scripts/seed-mock-data.ts
```
This creates all database records including users, communities, channels, and participants.

### Step 3: Sync to GetStream
```bash
npx tsx scripts/seed-getstream.ts
```
This reads from the database and syncs everything to GetStream, including:
- Creating users in GetStream
- Creating channels with matching IDs
- Adding members to channels
- Sending sample messages

### Step 4: Test the API
```bash
# Call the joined channels endpoint
GET /v1/user/chat/joined-channels

# You should now see:
{
  "data": {
    "channels": [
      {
        "id": "community_xxx-xxx-xxx",
        "name": "Community Name",
        "lastMessage": {
          "id": "msg-id",
          "text": "Hello everyone!",
          "user": { "id": "user-id", "name": "Username" },
          "createdAt": "2026-01-04T12:34:56.000Z"
        },
        "unreadCount": 5,
        "lastMessageAt": "2026-01-04T12:34:56.000Z",
        ...
      }
    ]
  }
}
```

## 📊 What's Fixed

✅ **Channel IDs now match** between database and GetStream
✅ **Last messages load correctly** from GetStream
✅ **Unread counts display accurately**
✅ **Last message timestamps show properly**
✅ **Participants stored in both database and GetStream**
✅ **Complete hybrid architecture working** as recommended

## 🔧 Files Modified

1. `src/domain/user/chat/chat.service.ts` - Enhanced GetStream query and data merging
2. `src/domain/user/chat/dto/channel.dto.ts` - Added `lastMessageAt` field
3. `src/domain/user/chat/chat.controller.ts` - Updated response types
4. `scripts/seed-mock-data.ts` - DATABASE ONLY: Creates channels & participants in database
5. `scripts/seed-getstream.ts` - NEW: Reads from DB and syncs to GetStream
6. `scripts/cleanup-stream-data.ts` - NEW: Cleanup script to delete GetStream data

## 🎯 Result

The backend now properly merges database metadata with GetStream real-time data:
- **Database** provides: channel name, description, community info, member list
- **GetStream** provides: unread counts, last messages, real-time state
- **Frontend** receives: Complete channel data in a single API call

The hybrid architecture is now fully functional! 🎉
