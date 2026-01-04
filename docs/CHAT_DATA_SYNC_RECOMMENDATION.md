# Chat Data Sync - Architecture Recommendation

## 🚨 Current Problem

The app currently makes **TWO separate API calls** for chat data:

1. **Backend API** - `/v1/user/chat/joined-channels`, `/v1/user/chat/my-channels`
2. **GetStream SDK** - Direct `client.queryChannels()` calls

This creates **data sync issues**:
- Backend has channel metadata (name, description, creator)
- GetStream has real-time data (unread count, last message)
- Merging logic in frontend is complex and error-prone
- Data can be out of sync if one source updates before the other

---

## ✅ RECOMMENDED APPROACH: Hybrid Architecture

### Architecture
```
Initial Load:  Frontend → Backend API → Backend merges (DB + GetStream) → Returns unified data
Real-time:     Frontend → GetStream SDK Events → Update UI instantly
```

### Why Hybrid Is Best
1. **Single API call for initial load** - Frontend calls backend once
2. **Backend controls data consistency** - Backend ensures DB and GetStream are synced
3. **Real-time updates** - GetStream SDK events update UI instantly (no polling!)
4. **Simpler frontend** - No complex merging logic, just event handlers
5. **Better caching** - React Query caches complete channel data
6. **Best UX** - Fast initial load + instant real-time updates
7. **Type safety** - OpenAPI schema defines the complete channel shape

### What Each Layer Does

**Backend:**
- Merges DB (metadata) + GetStream (real-time state) for initial load
- Returns complete channel data with unread counts and last messages
- Ensures data consistency

**Frontend:**
- Loads initial data from backend API (1 call)
- Subscribes to GetStream events (`message.new`, `notification.mark_read`, etc.)
- Updates local state when events arrive
- No more dual API calls or complex merging

---

## 📋 Backend Implementation Required

### 1. Update Existing Endpoints to Include Real-Time Data

#### `GET /v1/user/chat/joined-channels`
**Current Response:**
```typescript
{
  id: string,
  name: string,
  type: string,
  // ... other DB fields
}
```

**Enhanced Response (include GetStream data):**
```typescript
{
  id: string,
  name: string,
  type: string,
  description?: string,
  image?: string,
  memberCount: number,
  isJoined: boolean,
  
  // ⭐ ADD THESE from GetStream:
  unreadCount: number,           // From GetStream channel.state.unread_count
  lastMessage?: {                // From GetStream channel.state.messages[-1]
    id: string,
    text: string,
    createdAt: string,
    user: {
      id: string,
      name: string
    }
  },
  lastMessageAt?: string,        // From GetStream channel.last_message_at
  
  createdAt: string,
  updatedAt: string
}
```

#### Backend Implementation Pattern:
```typescript
async getJoinedChannels(userId: string) {
  // 1. Get channels from database
  const dbChannels = await this.prisma.chatChannel.findMany({
    where: {
      participants: {
        some: { userId, deletedAt: null }
      }
    },
    include: {
      participants: true
    }
  });

  // 2. Get channel IDs
  const channelIds = dbChannels.map(ch => ch.id);
  
  // 3. Query GetStream for real-time data (single batch query)
  const streamChannels = await this.streamClient.queryChannels(
    { id: { $in: channelIds } },
    [{ last_message_at: -1 }],
    { state: true }
  );

  // 4. Create map for quick lookup
  const streamMap = new Map(
    streamChannels.map(ch => [ch.id, ch])
  );

  // 5. Merge and return
  return dbChannels.map(dbChannel => {
    const streamCh = streamMap.get(dbChannel.id);
    const lastMsg = streamCh?.state?.messages?.[
      streamCh.state.messages.length - 1
    ];

    return {
      // DB fields
      id: dbChannel.id,
      name: dbChannel.name,
      type: dbChannel.type,
      description: dbChannel.description,
      image: dbChannel.image,
      memberCount: dbChannel.participants.length,
      isJoined: true,
      
      // GetStream real-time fields
      unreadCount: streamCh?.state?.unread_count || 0,
      lastMessage: lastMsg ? {
        id: lastMsg.id,
        text: lastMsg.text,
        createdAt: lastMsg.created_at,
        user: {
          id: lastMsg.user?.id || '',
          name: lastMsg.user?.name || ''
        }
      } : undefined,
      lastMessageAt: streamCh?.last_message_at,
      
      // Timestamps
      createdAt: dbChannel.createdAt.toISOString(),
      updatedAt: dbChannel.updatedAt.toISOString()
    };
  });
}
```

### 2. Apply Same Pattern to Other Endpoints

- ✅ `GET /v1/user/chat/my-channels` - Include GetStream data
- ✅ `GET /v1/user/chat/joined-channels` - Include GetStream data
- ✅ `POST /v1/user/chat/channels/{channelId}/join` - Return channel with GetStream data
- ✅ `POST /v1/user/chat/channels/{channelId}/leave` - Return updated channel

---

## 🎯 Frontend Simplification

### Current Code (Complex - 2 API calls):
```typescript
// ChatChannelsProvider.tsx - CURRENT
const { channels: dbChannels } = useGetJoinedChannels();  // Backend API
const streamChannels = await client.queryChannels(...);   // GetStream SDK

// Complex merging logic
const merged = dbChannels.map(db => {
  const stream = streamMap.get(db.id);
  return { ...db, ...stream.state };  // Prone to errors
});
```

### Simplified Code (1 API call):
```typescript
// ChatChannelsProvider.tsx - SIMPLIFIED
const { channels } = useGetJoinedChannels();  // Backend API only
// That's it! No merging needed, backend already did it
```

### Remove GetStream Direct Queries

**Remove this code:**
```typescript
// ❌ DELETE - No longer needed
const streamChannels = await client.queryChannels({
  members: { $in: [userId] }
}, ...);
```

**Keep only backend API calls:**
```typescript
// ✅ KEEP - Single source of truth
const { data } = backendApi.useQuery('get', '/v1/user/chat/joined-channels');
```

---

## 🔄 Real-Time Updates Strategy

### Recommended: GetStream Events (Real-time UX)

Keep GetStream SDK for real-time event notifications and **update local state directly**:

```typescript
const ChatChannelsProvider = ({ children }) => {
  // 1. Initial load from backend (complete data)
  const { data } = useGetJoinedChannels()
  const [channels, setChannels] = useState(data?.channels || [])
  const { client } = useChatContext()

  // 2. Sync backend data to state on load
  useEffect(() => {
    if (data?.channels) {
      setChannels(data.channels)
    }
  }, [data])

  // 3. Listen to GetStream events for real-time updates
  useEffect(() => {
    if (!client) return
    
    // Update unread count and last message when new message arrives
    const handleNewMessage = (event) => {
      setChannels(prev => prev.map(channel => {
        if (channel.id === event.channel_id) {
          return {
            ...channel,
            unreadCount: channel.unreadCount + 1,
            lastMessage: {
              id: event.message.id,
              text: event.message.text,
              user: event.message.user,
              createdAt: event.message.created_at
            },
            lastMessageAt: event.message.created_at
          }
        }
        return channel
      }))
    }
    
    // Reset unread count when channel is marked as read
    const handleMarkRead = (event) => {
      setChannels(prev => prev.map(channel => {
        if (channel.id === event.channel_id) {
          return { ...channel, unreadCount: 0 }
        }
        return channel
      }))
    }
    
    client.on('message.new', handleNewMessage)
    client.on('notification.mark_read', handleMarkRead)
    
    return () => {
      client.off('message.new', handleNewMessage)
      client.off('notification.mark_read', handleMarkRead)
    }
  }, [client])

  return (
    <ChatChannelsContext.Provider value={{ channels }}>
      {children}
    </ChatChannelsContext.Provider>
  )
}
```

**GetStream SDK is used for:**
- ✅ Real-time event notifications (`message.new`, `notification.mark_read`)
- ✅ Sending messages
- ✅ Real-time chat UI in ChatWindow
- ✅ Typing indicators, presence, reactions

**NOT used for:**
### Phase 1: Backend Updates
1. Update `GET /v1/user/chat/joined-channels` to include GetStream data
2. Update `GET /v1/user/chat/my-channels` to include GetStream data
3. Add these fields to responses:
   - `unreadCount` (from GetStream)
   - `lastMessage` (from GetStream)
   - `lastMessageAt` (from GetStream)
4. Update OpenAPI schema
5. Test with Postman/curl

### Phase 2: Frontend Updates
1. Run `yarn generate-type` to get new types
2. Update `ChatChannelsProvider`:
   - Remove `client.queryChannels()` calls
   - Load initial data from backend only
   - Add GetStream event listeners for real-time updates
   - Update local state when events arrive
3. Simplify hooks (remove merging logic)
4. Test thoroughly:
   - Initial load shows correct data
   - New messages update UI instantly
   - Unread counts update in real-time
   - Mark as read resets unread count

### Phase 3: Cleanup
- Remove unused GetStream query code
- Remove complex merging utilities
- Update documentation
- Performance testing

---

## 💡 Summary

**Current:** 
```
Frontend ← Backend API + GetStream SDK queries (complex, sync issues)
```

**Recommended:** 
```
Initial Load: Frontend ← Backend API (DB + GetStream merged)
Real-time:    Frontend ← GetStream SDK events → Update state
```

**Result:** 
- ✅ Simpler code (no merging logic)
- ✅ Faster initial load (1 API call)
- ✅ True real-time updates (event-driven)
- ✅ Data consistency (backend ensures sync)
- ✅ Better UX (instant message updates)
- [ ] Simplify to single backend API call
- [ ] Keep GetStream SDK only for events and messaging
- [ ] Update TypeScript types from OpenAPI
- [ ] Test channel list updates
- [ ] Test real-time message updates

---

## 🎯 Expected Benefits

1. ✅ **Simpler Code** - Remove 100+ lines of merging logic
2. ✅ **Better Performance** - One API call instead of two
3. ✅ **Data Consistency** - Backend ensures sync
4. ✅ **Easier Debugging** - Single data flow
5. ✅ **Better Caching** - React Query caches complete data
6. ✅ **Type Safety** - OpenAPI schema defines everything

---

## 🚀 Recommended Implementation Order

1. **Backend First:**
   - Update `joined-channels` endpoint
   - Update `my-channels` endpoint
   - Test with Postman/curl

2. **Frontend Second:**
   - Run `yarn generate-type` to get new types
   - Remove GetStream query logic
   - Simplify ChatChannelsProvider
   - Test thoroughly

3. **Cleanup:**
   - Remove unused code
   - Update documentation
   - Remove complex merging utilities

---

## 💡 Summary

**Current:** Frontend ← Backend API + GetStream SDK (complex, sync issues)

**Recommended:** Frontend ← Backend API (Backend merges DB + GetStream)

**Result:** Simpler, faster, more reliable chat experience
