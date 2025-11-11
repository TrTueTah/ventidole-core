# Chat System Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT APPLICATIONS                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   iOS App    │  │  Android App │  │   Web App    │         │
│  │  (Swift)     │  │   (Kotlin)   │  │  (React/Vue) │         │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │
│         │                  │                  │                  │
│         └──────────────────┼──────────────────┘                  │
│                            │                                     │
└────────────────────────────┼─────────────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │   HTTPS / WebSocket     │
                └────────────┬────────────┘
                             │
┌────────────────────────────┼─────────────────────────────────────┐
│                     BACKEND SERVER                               │
│                    (NestJS + Node.js)                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │                    API Gateway                            │  │
│  │                  (JWT Authentication)                     │  │
│  └────────────────────┬──────────────┬──────────────────────┘  │
│                       │              │                          │
│         ┌─────────────┴──────┐  ┌───┴──────────────┐          │
│         │   REST Controller  │  │  WebSocket       │          │
│         │  (chat.controller) │  │  Gateway         │          │
│         │                    │  │  (chat.gateway)  │          │
│         │  - POST /channels  │  │                  │          │
│         │  - POST /messages  │  │  Events:         │          │
│         │  - GET /messages   │  │  • new_message   │          │
│         │  - POST /read      │  │  • user_typing   │          │
│         └─────────┬──────────┘  │  • user_status   │          │
│                   │              │  • message_read  │          │
│         ┌─────────┴──────────────┴──────────┐      │          │
│         │       Chat Service                │      │          │
│         │     (chat.service.ts)              │      │          │
│         │                                    │      │          │
│         │  Business Logic:                   │      │          │
│         │  • Create channels                 │      │          │
│         │  • Send messages                   │      │          │
│         │  • Manage participants             │      │          │
│         │  • Update read status             │      │          │
│         └────┬─────────┬───────────┬─────────┘      │          │
│              │         │           │                 │          │
└──────────────┼─────────┼───────────┼─────────────────┼──────────┘
               │         │           │                 │
     ┌─────────┴──┐  ┌───┴────┐  ┌──┴────────┐  ┌────┴─────┐
     │            │  │        │  │           │  │          │
┌────▼─────┐  ┌──▼──▼───┐  ┌─▼───▼──────┐  ┌─▼──────────▼──┐
│PostgreSQL│  │Firebase │  │Notification│  │  Redis Cache  │
│          │  │Firestore│  │  Service   │  │   (Future)    │
│          │  │         │  │   (FCM)    │  │               │
└──────────┘  └─────────┘  └────────────┘  └───────────────┘
```

## Data Flow Architecture

### 1. Sending a Message

```
┌─────────┐
│ Client  │
└────┬────┘
     │ 1. POST /chat/messages (REST)
     │    { channelId, type, content }
     ▼
┌─────────────────┐
│   Controller    │
│ (Authorization) │
└────┬────────────┘
     │ 2. Validate user is participant
     ▼
┌──────────────────┐
│   Chat Service   │
└────┬─────────────┘
     │
     │ 3. Save to Firebase
     ├──────────────────────────────────┐
     │                                   ▼
     │                          ┌────────────────┐
     │                          │    Firestore   │
     │                          │  chat_messages │
     │                          │   collection   │
     │                          └────────────────┘
     │
     │ 4. Update PostgreSQL metadata
     ├──────────────────────────────────┐
     │                                   ▼
     │                          ┌────────────────┐
     │                          │  PostgreSQL    │
     │                          │ • lastMessageAt│
     │                          │ • unreadCount++│
     │                          └────────────────┘
     │
     │ 5. Send push notifications
     ├──────────────────────────────────┐
     │                                   ▼
     │                          ┌────────────────┐
     │                          │      FCM       │
     │                          │ (Offline users)│
     │                          └────────────────┘
     │
     │ 6. Broadcast via WebSocket
     ├──────────────────────────────────┐
     ▼                                   ▼
┌──────────────┐              ┌──────────────────┐
│Chat Gateway  │──────────────▶│ Socket.IO Rooms │
│emit to room  │              │  (Connected users)│
└──────────────┘              └─────────┬─────────┘
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                     ┌────▼────┐              ┌───────▼────┐
                     │Client 1 │              │ Client 2   │
                     │ (Online)│              │  (Online)  │
                     └─────────┘              └────────────┘
```

### 2. Real-time Message Reception

```
┌──────────────┐
│ WebSocket    │
│ Connection   │
└──────┬───────┘
       │ 1. Connect with JWT
       ▼
┌──────────────┐
│Chat Gateway  │
│- Verify auth │
│- Store conn  │
└──────┬───────┘
       │ 2. Auto-join user's channels
       │
       ├──────────────────────────────┐
       │                              ▼
       │                    ┌──────────────────┐
       │                    │   PostgreSQL     │
       │                    │ Get user channels│
       │                    └────────┬─────────┘
       │                             │
       │ 3. Join Socket.IO rooms     │
       ◄─────────────────────────────┘
       │
       │ 4. Listen for events
       │
       ├──► new_message
       ├──► user_typing
       ├──► user_status_changed
       ├──► message_read_receipt
       └──► new_channel
```

## Database Schema Detail

### PostgreSQL (Relational Metadata)

```
┌─────────────────────────────────────────────────────────┐
│                     chat_channels                        │
├────────────┬─────────────────┬──────────────────────────┤
│ id         │ VARCHAR(255)    │ PRIMARY KEY              │
│ name       │ VARCHAR(255)    │ NULLABLE                 │
│ type       │ ENUM            │ DIRECT/GROUP/ANNOUNCE    │
│ group_id   │ VARCHAR(255)    │ FK → groups.id          │
│ idol_id    │ VARCHAR(255)    │ FK → idols.id           │
│ is_ann...  │ BOOLEAN         │ DEFAULT false            │
│ firebase..│ VARCHAR(255)    │ UNIQUE (Firebase ref)    │
│ last_msg..│ TIMESTAMP       │ For sorting              │
│ created_at │ TIMESTAMP       │                          │
│ updated_at │ TIMESTAMP       │                          │
└────────────┴─────────────────┴──────────────────────────┘
         │
         │ 1:N relationship
         ▼
┌─────────────────────────────────────────────────────────┐
│                  chat_participants                       │
├────────────┬─────────────────┬──────────────────────────┤
│ id         │ VARCHAR(255)    │ PRIMARY KEY              │
│ channel_id │ VARCHAR(255)    │ FK → chat_channels.id   │
│ user_id    │ VARCHAR(255)    │ FK → users.id           │
│ role       │ ENUM            │ ADMIN / MEMBER           │
│ last_read..│ TIMESTAMP       │ Last read message time   │
│ unread_...│ INTEGER         │ Unread message count     │
│ is_muted   │ BOOLEAN         │ Notification muted       │
│ created_at │ TIMESTAMP       │                          │
│ updated_at │ TIMESTAMP       │                          │
└────────────┴─────────────────┴──────────────────────────┘
         │
         │ N:1 relationship
         ▼
┌─────────────────────────────────────────────────────────┐
│                        users                             │
├────────────┬─────────────────┬──────────────────────────┤
│ id         │ VARCHAR(255)    │ PRIMARY KEY              │
│ email      │ VARCHAR(255)    │ UNIQUE                   │
│ role       │ ENUM            │ FAN / IDOL / ADMIN       │
│ is_online  │ BOOLEAN         │ WebSocket status         │
│ device_...│ VARCHAR(255)    │ For push notifications   │
└────────────┴─────────────────┴──────────────────────────┘
```

### Firebase Firestore (Document Messages)

```
Collection: chat_messages
├── {messageId1}
│   ├── channelId: "channel-123"
│   ├── senderId: "user-456"
│   ├── senderName: "John Idol"
│   ├── senderAvatar: "https://..."
│   ├── type: "TEXT"
│   ├── content: "Hello fans!"
│   ├── mediaUrl: null
│   ├── thumbnailUrl: null
│   ├── metadata: {}
│   ├── replyTo: null
│   ├── createdAt: Timestamp(2025-01-01T10:00:00Z)
│   ├── updatedAt: Timestamp(2025-01-01T10:00:00Z)
│   ├── isDeleted: false
│   └── readBy: ["user-456", "user-789"]
│
├── {messageId2}
│   ├── channelId: "channel-123"
│   ├── senderId: "user-789"
│   ├── type: "IMAGE"
│   ├── content: "Check this out!"
│   ├── mediaUrl: "https://storage.../image.jpg"
│   ├── thumbnailUrl: "https://storage.../thumb.jpg"
│   └── ...
│
└── {messageId3}
    └── ...

Indexes:
  - channelId + createdAt (DESC)  ← For message pagination
  - senderId + createdAt          ← For user's messages
```

## Component Interaction

```
┌────────────────────────────────────────────────────────┐
│                    ChatModule                          │
│                                                        │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │
│  │              │  │              │  │             │ │
│  │ Controller   │◄─┤   Service    │◄─┤   Gateway   │ │
│  │              │  │              │  │             │ │
│  │ • REST API   │  │ • Business   │  │ • WebSocket │ │
│  │ • Validation │  │   Logic      │  │ • Events    │ │
│  │ • Swagger    │  │ • Database   │  │ • Broadcast │ │
│  │              │  │ • Firebase   │  │             │ │
│  └──────┬───────┘  └──────┬───────┘  └──────┬──────┘ │
│         │                 │                  │        │
└─────────┼─────────────────┼──────────────────┼────────┘
          │                 │                  │
          │    ┌────────────┴────────┐        │
          │    │                     │        │
          ▼    ▼                     ▼        ▼
    ┌──────────────┐         ┌──────────────────┐
    │ PrismaService│         │ NotificationService│
    └──────┬───────┘         └──────────────────┘
           │                          │
           ▼                          ▼
    ┌────────────┐            ┌────────────┐
    │ PostgreSQL │            │    FCM     │
    └────────────┘            └────────────┘
           │
           ▼
    ┌────────────┐
    │ Firestore  │
    └────────────┘
```

## Scalability Considerations

### Horizontal Scaling

```
                    Load Balancer
                         │
        ┌────────────────┼────────────────┐
        │                │                │
   ┌────▼────┐      ┌────▼────┐     ┌────▼────┐
   │Server 1 │      │Server 2 │     │Server 3 │
   │ NestJS  │      │ NestJS  │     │ NestJS  │
   └────┬────┘      └────┬────┘     └────┬────┘
        │                │                │
        └────────────────┼────────────────┘
                         │
              ┌──────────┴──────────┐
              │                     │
         ┌────▼────┐         ┌─────▼─────┐
         │  Redis  │         │PostgreSQL │
         │ Adapter │         │  Cluster  │
         │(Socket) │         │           │
         └─────────┘         └───────────┘

Note: Redis adapter needed for WebSocket sync across servers
```

## Security Layers

```
┌─────────────────────────────────────────────┐
│           Client Request                     │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│      1. HTTPS / WSS Encryption              │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│      2. JWT Authentication                  │
│         - Verify token signature            │
│         - Check expiration                  │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│      3. Authorization                       │
│         - User in channel?                  │
│         - Has permission?                   │
│         - Channel type check                │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│      4. Input Validation                    │
│         - DTO validation                    │
│         - Sanitize content                  │
└───────────────┬─────────────────────────────┘
                │
┌───────────────▼─────────────────────────────┐
│      5. Rate Limiting (Future)              │
│         - Per user limits                   │
│         - Channel limits                    │
└───────────────┬─────────────────────────────┘
                │
                ▼
         Process Request
```

## Performance Optimization

```
Query Optimization:
├── PostgreSQL
│   ├── Index on user_id (participant lookup)
│   ├── Index on channel_id (messages by channel)
│   ├── Index on last_message_at (channel sorting)
│   └── Composite index (channel_id, user_id)
│
├── Firebase
│   ├── Index on channelId + createdAt
│   └── Pagination with startAfter()
│
└── Caching (Future)
    ├── Redis: Channel list
    ├── Redis: Unread counts
    └── Redis: Online users
```

---

This architecture provides:
- ✅ **Scalability**: Horizontal scaling support
- ✅ **Performance**: Optimized queries and indexes
- ✅ **Real-time**: WebSocket for instant updates
- ✅ **Reliability**: Hybrid database for resilience
- ✅ **Security**: Multi-layer authentication/authorization
- ✅ **Maintainability**: Clean separation of concerns
