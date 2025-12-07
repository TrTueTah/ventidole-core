# Stream Chat & Knock Integration Guide

This guide provides a comprehensive overview of integrating Stream Chat and Knock services, based on the implementation in this project.

## Table of Contents

- [Overview](#overview)
- [Stream Chat Integration](#stream-chat-integration)
- [Knock Integration](#knock-integration)
- [Environment Variables](#environment-variables)
- [Installation](#installation)
- [Implementation Examples](#implementation-examples)

---

## Overview

This project integrates two third-party services:

1. **Stream Chat** - Real-time messaging, channels, and chat events
2. **Knock** - Cross-channel notifications (in-app, push, email, Slack, etc.)

Both services require server-side configuration, authentication, and webhook handling.

---

## Stream Chat Integration

### Purpose
Real-time messaging platform for building chat features including direct messages, group channels, reactions, typing indicators, and read receipts.

### Configuration

**File:** `src/lib/streamChatConfig.ts`

```typescript
import { StreamChat } from 'stream-chat';

export const STREAM_CHAT_API_KEY = process.env.STREAM_CHAT_API_KEY;
const STREAM_CHAT_SECRET = process.env.STREAM_CHAT_SECRET;

const streamChatClient = StreamChat.getInstance(
  STREAM_CHAT_API_KEY, 
  STREAM_CHAT_SECRET
);

export default streamChatClient;
```

### API Endpoints

#### 1. User Token Generation

**Endpoint:** `POST /stream-chat/users/token`

**Purpose:** Generate authentication token for client-side SDK

**Request Body:**
```json
{
  "userId": "user123"
}
```

**Response:**
```json
{
  "token": "eyJhbGc...",
  "apiKey": "your_api_key",
  "userId": "user123"
}
```

**Implementation:**
```typescript
const token = streamChatClient.createToken(userId);
```

#### 2. User Management

**Endpoint:** `POST /stream-chat/users`

**Purpose:** Create or update Stream Chat user

**Request Body:**
```json
{
  "userId": "user123",
  "name": "John Doe",
  "image": "https://example.com/avatar.jpg",
  "role": "user"
}
```

#### 3. Channel Management

**Endpoint:** `POST /stream-chat/channels`

**Purpose:** Create channels (direct, messaging, team, etc.)

#### 4. Message Operations

**Endpoint:** `POST /stream-chat/messages`

**Purpose:** Send, update, or delete messages

#### 5. Admin Operations

**Endpoint:** `/stream-chat/admin/*`

**Purpose:** Administrative tasks like user moderation, channel cleanup

#### 6. Notifications

**Endpoint:** `/stream-chat/notifications/*`

**Purpose:** Manage push notification settings and delivery

### Webhook Integration

**Endpoint:** `POST /stream-chat/webhook`

**Security:** Validates `x-signature` header using HMAC-SHA256

**Signature Verification:**
```typescript
const verifyWebhookSignature = (body: string, signature: string): boolean => {
  const hash = crypto
    .createHmac('sha256', STREAM_CHAT_WEBHOOK_SECRET)
    .update(body)
    .digest('hex');
  return hash === signature;
};
```

**Supported Event Types:**
- **Messages:** `message.new`, `message.updated`, `message.deleted`, `message.read`
- **Reactions:** `reaction.new`, `reaction.updated`, `reaction.deleted`
- **Channels:** `channel.created`, `channel.updated`, `channel.deleted`
- **Members:** `member.added`, `member.removed`, `member.updated`
- **Users:** `user.updated`, `user.deleted`, `user.banned`, `user.unbanned`
- **Typing:** `typing.start`, `typing.stop`
- **Moderation:** `message.flagged`, `message.flag.updated`

### Router Structure

**File:** `src/api/routes/streamChat/index.ts`

```typescript
router.use('/users', streamChatUsersRouter);
router.use('/channels', streamChatChannelsRouter);
router.use('/messages', streamChatMessagesRouter);
router.use('/webhook', streamChatWebhookRouter);
router.use('/admin', streamChatAdminRouter);
router.use('/notifications', streamChatNotificationsRouter);
```

---

## Knock Integration

### Purpose
Cross-channel notification orchestration platform supporting in-app, push, email, SMS, Slack, and other channels through workflows.

### Configuration

**File:** `src/lib/knockConfig.ts`

```typescript
import { Knock } from '@knocklabs/node';

export const KNOCK_SECRET_KEY = process.env.KNOCK_SECRET_KEY;
export const KNOCK_SIGNING_KEY = process.env.KNOCK_SIGNING_KEY;

// Channel IDs from Knock Dashboard
export const KNOCK_PUSH_CHANNEL_ID = process.env.KNOCK_PUSH_CHANNEL_ID;
export const KNOCK_IN_APP_CHANNEL_ID = process.env.KNOCK_IN_APP_CHANNEL_ID;
export const KNOCK_EMAIL_CHANNEL_ID = process.env.KNOCK_EMAIL_CHANNEL_ID;
export const KNOCK_WHATSAPP_CHANNEL_ID = process.env.KNOCK_WHATSAPP_CHANNEL_ID;
export const KNOCK_SLACK_CHANNEL_ID = process.env.KNOCK_SLACK_CHANNEL_ID;

// Workflow Keys
export const KNOCK_IN_APP_NOTIFICATION_WORKFLOW_KEY = 
  process.env.KNOCK_IN_APP_NOTIFICATION_WORKFLOW_KEY || 'in-app-notification';

const knockClient = new Knock({ apiKey: KNOCK_SECRET_KEY });

export default knockClient;
```

### API Endpoints

#### 1. User Token Generation

**Endpoint:** `POST /knock/auth/token`

**Purpose:** Generate signed token for client-side Knock SDK

**Authentication:** Requires authentication middleware

**Response:**
```json
{
  "success": true,
  "token": "signed_jwt_token",
  "userId": "user123",
  "expiresIn": 3600
}
```

**Implementation:**
```typescript
import { signUserToken } from '@knocklabs/node';

const userToken = await signUserToken(userId, {
  signingKey: KNOCK_SIGNING_KEY,
});
```

#### 2. Channel Data Management

**Endpoint:** `/knock/*`

**Purpose:** Manage channel-specific data and preferences

#### 3. Notifications

**Endpoint:** `/knock/notifications/*`

**Purpose:** Retrieve notification history, preferences, and feed data

### Workflow Services

Knock workflows are triggered from server-side service functions located in `src/services/knock/`.

#### Generic In-App Notification

**File:** `src/services/knock/sendInAppNotification.ts`

```typescript
interface SendInAppNotificationInput {
  userId: string;
  title: string;
  text: string;
  metadata?: Record<string, unknown>;
  actorId?: string;
}

export const sendKnockInAppNotification = async ({
  userId,
  title,
  text,
  metadata,
  actorId,
}: SendInAppNotificationInput) => {
  const payload = {
    recipients: [userId],
    data: { title, text, metadata },
    actor: actorId ? { id: actorId, name: 'Admin' } : { id: 'system', name: 'System' }
  };

  const response = await knockClient.workflows.trigger(
    KNOCK_IN_APP_NOTIFICATION_WORKFLOW_KEY,
    payload
  );

  return { success: true, workflowRunId: response.workflow_run_id };
};
```

#### Specialized Workflow Examples

**Connection Request Workflow**
- **File:** `src/services/knock/connectionRequestWorkflow.ts`
- **Purpose:** Notify users of new connection requests
- **Channels:** In-app, Push

**Event Approved Workflow**
- **File:** `src/services/knock/eventApprovedWorkflow.ts`
- **Purpose:** Notify event creators when their event is approved
- **Channels:** In-app, Push, Email

**Event Cancelled Workflow**
- **File:** `src/services/knock/eventCancelledWorkflow.ts`
- **Purpose:** Notify attendees when an event is cancelled
- **Channels:** In-app, Push, Email

**New Event Submission Workflow**
- **File:** `src/services/knock/newEventSubmissionWorkflow.ts`
- **Purpose:** Notify admins of new event submissions for review
- **Channels:** In-app, Slack

**User Account Approved/Rejected Workflows**
- **Files:** `userAccountApprovedWorkflow.ts`, `userAccountRejectedWorkflow.ts`
- **Purpose:** Notify users about account status changes
- **Channels:** In-app, Push, Email

**Friend Connection Match Workflow**
- **File:** `src/services/knock/friendConnectionMatchWorkflow.ts`
- **Purpose:** Notify users when connection is mutually accepted
- **Channels:** In-app, Push

**Attendance Cancelled Workflow**
- **File:** `src/services/knock/attendanceCancelledWorkflow.ts`
- **Purpose:** Notify event organizers when someone cancels attendance
- **Channels:** In-app, Push

**Event Message Workflow**
- **File:** `src/services/knock/eventMessageWorkflow.ts`
- **Purpose:** Notify attendees of event-related messages
- **Channels:** In-app, Push

**User Images Rejected Workflow**
- **File:** `src/services/knock/userImagesRejectedWorkflow.ts`
- **Purpose:** Notify users when uploaded images are rejected
- **Channels:** In-app, Email

### Workflow Trigger Pattern

All workflow services follow a similar pattern:

```typescript
export const triggerWorkflow = async (input: WorkflowInput) => {
  const payload = {
    recipients: [userId], // or array of user IDs
    data: {
      // Template variables
      userName: 'John',
      eventName: 'Beach Volleyball',
      // ... other variables
    },
    actor: {
      id: actorId || 'system',
      name: actorName || 'System'
    }
  };

  await knockClient.workflows.trigger('workflow-key', payload);
};
```

### Router Structure

**File:** `src/api/routes/knock/index.ts`

```typescript
router.use('/auth', authRouter);
router.use('/', channelDataRouter);
router.use('/notifications', notificationsRouter);
```

---

## Environment Variables

### Stream Chat

```env
# Stream Chat Configuration
STREAM_CHAT_API_KEY=your_stream_api_key
STREAM_CHAT_SECRET=your_stream_secret
STREAM_CHAT_WEBHOOK_SECRET=your_webhook_secret
```

**Where to find:**
- Dashboard: https://getstream.io/dashboard/
- Navigate to your app → App Settings → API Keys

### Knock

```env
# Knock Configuration
KNOCK_SECRET_KEY=sk_test_... # or sk_prod_...
KNOCK_SIGNING_KEY=your_signing_key

# Channel IDs (Get from Knock Dashboard → Channels)
KNOCK_PUSH_CHANNEL_ID=uuid-for-push-channel
KNOCK_IN_APP_CHANNEL_ID=uuid-for-in-app-channel
KNOCK_EMAIL_CHANNEL_ID=uuid-for-email-channel
KNOCK_WHATSAPP_CHANNEL_ID=uuid-for-whatsapp-channel
KNOCK_SLACK_CHANNEL_ID=uuid-for-slack-channel

# Workflow Keys (Get from Knock Dashboard → Workflows)
KNOCK_IN_APP_NOTIFICATION_WORKFLOW_KEY=in-app-notification
```

**Where to find:**
- Dashboard: https://dashboard.knock.app/
- Secret Key: Settings → API Keys → Secret Key
- Signing Key: Settings → API Keys → Signing Keys
- Channel IDs: Channels → Click on channel → Copy ID from URL or settings
- Workflow Keys: Workflows → Click on workflow → Key shown at top

---

## Installation

### Dependencies

```bash
npm install stream-chat @knocklabs/node dotenv
```

### Package Versions

```json
{
  "dependencies": {
    "stream-chat": "^8.x.x",
    "@knocklabs/node": "^0.6.x",
    "dotenv": "^16.x.x"
  }
}
```

---

## Implementation Examples

### Client-Side Integration

#### Stream Chat (React Example)

```typescript
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';

// 1. Get token from your backend
const response = await fetch('/api/stream-chat/users/token', {
  method: 'POST',
  body: JSON.stringify({ userId: 'user123' }),
  headers: { 'Content-Type': 'application/json' }
});
const { token, apiKey } = await response.json();

// 2. Initialize client
const chatClient = StreamChat.getInstance(apiKey);

// 3. Connect user
await chatClient.connectUser(
  { id: 'user123', name: 'John Doe', image: 'avatar_url' },
  token
);

// 4. Use in your React app
<Chat client={chatClient}>
  {/* Your chat UI components */}
</Chat>
```

#### Knock (React Example)

```typescript
import { KnockProvider, KnockFeedProvider } from '@knocklabs/react';

// 1. Get token from your backend
const response = await fetch('/api/knock/auth/token', {
  method: 'POST',
  headers: { 
    'Authorization': `Bearer ${userAuthToken}`,
    'Content-Type': 'application/json'
  }
});
const { token } = await response.json();

// 2. Wrap your app
<KnockProvider
  apiKey={process.env.REACT_APP_KNOCK_PUBLIC_API_KEY}
  userId="user123"
  userToken={token}
>
  <KnockFeedProvider feedId={process.env.REACT_APP_KNOCK_FEED_ID}>
    {/* Your app components */}
  </KnockFeedProvider>
</KnockProvider>
```

### Server-Side Usage Examples

#### Triggering a Notification Workflow

```typescript
import knockClient from '../lib/knockConfig';

// Send notification when user gets a connection request
export const notifyConnectionRequest = async (
  recipientId: string,
  senderName: string,
  senderId: string
) => {
  await knockClient.workflows.trigger('connection-request', {
    recipients: [recipientId],
    data: {
      senderName,
      requestDate: new Date().toISOString(),
    },
    actor: {
      id: senderId,
      name: senderName,
    }
  });
};
```

#### Creating a Stream Chat Channel

```typescript
import streamChatClient from '../lib/streamChatConfig';

// Create a direct message channel
export const createDirectMessageChannel = async (
  userId1: string,
  userId2: string
) => {
  const channel = streamChatClient.channel('messaging', {
    members: [userId1, userId2],
  });
  
  await channel.create();
  return channel;
};
```

#### Handling Stream Chat Webhooks

```typescript
// In your webhook handler
router.post('/webhook', async (req, res) => {
  const event = req.body;
  
  switch (event.type) {
    case 'message.new':
      // Trigger Knock notification for offline users
      await notifyOfflineUsers(event);
      break;
    
    case 'message.flagged':
      // Alert moderators via Slack
      await alertModerators(event);
      break;
  }
  
  res.status(200).json({ success: true });
});
```

---

## Best Practices

### Security

1. **Never expose secrets to client-side code** - Only API keys and public keys should be client-facing
2. **Validate webhook signatures** - Always verify Stream Chat webhook signatures
3. **Use signed tokens** - Generate time-limited tokens for both services
4. **Implement rate limiting** - Protect your token generation endpoints

### Error Handling

```typescript
try {
  await knockClient.workflows.trigger('workflow-key', payload);
} catch (error) {
  if (error.response?.status === 429) {
    // Rate limit exceeded - implement retry logic
  } else if (error.response?.status === 404) {
    // Workflow not found - check configuration
  }
  console.error('Knock error:', error);
  // Implement fallback notification method
}
```

### Performance

1. **Batch operations** - Use bulk user updates when possible
2. **Cache tokens** - Client tokens can be cached until expiry
3. **Async workflows** - Don't wait for Knock workflows in critical paths
4. **Webhook queuing** - Process webhooks asynchronously in production

### Monitoring

```typescript
// Log all workflow triggers for debugging
knockClient.workflows.trigger('workflow-key', payload).then(result => {
  console.log('Workflow triggered:', {
    workflowRunId: result.workflow_run_id,
    recipients: payload.recipients,
    timestamp: new Date().toISOString()
  });
});
```

---

## Testing

### Stream Chat Test

```typescript
// Test token generation
const token = streamChatClient.createToken('test-user');
console.log('Token generated:', token);

// Test channel creation
const channel = streamChatClient.channel('messaging', 'test-channel');
await channel.create();
console.log('Channel created');
```

### Knock Test

```typescript
// Test workflow trigger
await knockClient.workflows.trigger('in-app-notification', {
  recipients: ['test-user'],
  data: { title: 'Test', text: 'This is a test notification' }
});
console.log('Notification sent');
```

---

## Troubleshooting

### Common Issues

**Stream Chat:**
- **401 Unauthorized:** Check API key and secret in environment variables
- **Token expired:** Regenerate token from backend
- **Webhook signature mismatch:** Ensure webhook secret matches Stream dashboard

**Knock:**
- **Workflow not found:** Verify workflow key matches Knock dashboard
- **Channel not configured:** Check channel ID in environment variables
- **User not found:** Ensure user is created in Knock before triggering workflow

### Debug Mode

```typescript
// Enable debug logging for Stream Chat
streamChatClient.setLogLevel('debug');

// Knock debug (check response)
const result = await knockClient.workflows.trigger('key', payload);
console.log('Workflow run ID:', result.workflow_run_id);
```

---

## Additional Resources

- [Stream Chat Documentation](https://getstream.io/chat/docs/)
- [Knock Documentation](https://docs.knock.app/)
- [Stream Chat React SDK](https://getstream.io/chat/docs/sdk/react/)
- [Knock React SDK](https://docs.knock.app/sdks/react/overview)

---

## License

Refer to your project's license file for usage terms.
