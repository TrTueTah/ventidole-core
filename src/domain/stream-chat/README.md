# Stream Chat Module

Real-time messaging infrastructure for Ventidole using Stream Chat.

## Overview

This module provides a complete integration with Stream Chat, enabling real-time messaging features including:

- User authentication and management
- Channel creation and management
- Message sending and retrieval
- Member management

## Quick Start

1. **Set environment variables** in `.env`:

```env
STREAM_CHAT_API_KEY=your_api_key
STREAM_CHAT_SECRET=your_secret
STREAM_CHAT_WEBHOOK_SECRET=your_webhook_secret
```

2. **Use the service** in your code:

```typescript
import { StreamChatService } from '@domain/stream-chat/stream-chat.service';

constructor(private streamChatService: StreamChatService) {}

// Generate token for client
const token = await this.streamChatService.generateToken('user_123');

// Create user
await this.streamChatService.createOrUpdateUser({
  userId: 'user_123',
  name: 'John Doe',
  image: 'https://example.com/avatar.jpg',
});
```

## API Endpoints

All endpoints require JWT authentication.

### Token Generation

- `POST /stream-chat/token` - Generate Stream Chat token

### User Management

- `POST /stream-chat/users` - Create/update user
- `DELETE /stream-chat/users/:userId` - Delete user

### Channel Management

- `POST /stream-chat/channels` - Create channel
- `GET /stream-chat/channels/:userId` - Get user channels
- `DELETE /stream-chat/channels/:type/:id` - Delete channel
- `POST /stream-chat/channels/:type/:id/members` - Add members
- `DELETE /stream-chat/channels/:type/:id/members` - Remove members

### Messaging

- `POST /stream-chat/channels/:type/:id/messages` - Send message
- `GET /stream-chat/channels/:type/:id/messages` - Get messages

## Documentation

See [STREAM_CHAT_IMPLEMENTATION.md](../../docs/STREAM_CHAT_IMPLEMENTATION.md) for detailed documentation.

## Client SDKs

- React Native: `stream-chat-react-native`
- React: `stream-chat-react`
- Web: `stream-chat`

## Resources

- [Stream Chat Docs](https://getstream.io/chat/docs/)
- [API Reference](https://getstream.io/chat/docs/rest/)
