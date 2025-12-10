# Knock Notification Integration

## 📋 Overview

Knock is integrated into your Ventidole backend to provide cross-channel notifications including in-app, push, email, and more. The integration follows the same patterns as your other modules.

> **💡 Quick Start:** For most use cases, use the **[KnockWorkflowService](./KNOCK_WORKFLOW_SERVICE.md)** instead of the low-level KnockService. It provides pre-built workflows for common scenarios like new followers, post likes, comments, etc., and is automatically available across your entire application.

---

## 🏗️ Module Structure

```
src/domain/knock/
├── dto/
│   ├── generate-token.dto.ts      # Token response DTO
│   ├── send-notification.dto.ts   # Send notification request
│   └── workflow-response.dto.ts   # Workflow response DTO
├── knock.controller.ts            # API endpoints
├── knock.service.ts               # Business logic & workflows
└── knock.module.ts                # Module definition
```

**Configuration:**
```
src/core/config/
└── knock.config.ts                # Knock client initialization
```

**Shared Workflow Service:**
```
src/shared/service/knock-workflow/
├── knock-workflow.service.ts      # Pre-built notification workflows
└── knock-workflow.module.ts       # Global module (auto-available)
```

See **[KnockWorkflowService Documentation](./KNOCK_WORKFLOW_SERVICE.md)** for usage.

---

## 🔑 Required Environment Variables

Add these to your `.env` file (see [.env.knock.example](.env.knock.example) for reference):

```env
### KNOCK (Required)
# Get from: https://dashboard.knock.app/ → Settings → API Keys
KNOCK_SECRET_KEY=sk_test_your_secret_key_here
KNOCK_SIGNING_KEY=your_signing_key_here

### KNOCK (Optional)
# Channel IDs from Knock Dashboard → Channels
KNOCK_PUSH_CHANNEL_ID=your-push-channel-uuid
KNOCK_IN_APP_CHANNEL_ID=your-in-app-channel-uuid
KNOCK_EMAIL_CHANNEL_ID=your-email-channel-uuid

# Workflow keys from Knock Dashboard → Workflows
KNOCK_IN_APP_NOTIFICATION_WORKFLOW_KEY=in-app-notification
```

### How to Get Your Credentials

1. **Sign up at Knock:** https://knock.app/
2. **Get API Keys:**
   - Go to Settings → API Keys
   - Copy your **Secret Key** (starts with `sk_test_` or `sk_prod_`)
   - Generate a **Signing Key** for user tokens
3. **Get Channel IDs:**
   - Go to Channels
   - Click on each channel
   - Copy the UUID from the URL or settings
4. **Get Workflow Keys:**
   - Go to Workflows
   - Click on each workflow
   - Copy the key shown at the top

---

## 📡 API Endpoints

**Base URL:** `/v1/knock`
**Authentication:** All endpoints require JWT Bearer token

### 1. Generate Knock Token

Get authentication token for Knock client SDK.

```http
POST /v1/knock/token
Authorization: Bearer <jwt-token>
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "userId": "user_123",
    "expiresIn": 3600
  },
  "error": null,
  "errorCode": null
}
```

### 2. Send In-App Notification

Send a notification to users via the in-app channel.

```http
POST /v1/knock/notifications/in-app
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "recipients": ["user_123", "user_456"],
  "title": "New Message",
  "text": "You have a new message from John",
  "metadata": {
    "url": "/messages/123",
    "type": "message"
  },
  "actorId": "user_789"
}
```

**Response:**
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "success": true,
    "workflowRunId": "01HG2XQZV5YJ9K8M7N6P5Q4R3S"
  },
  "error": null,
  "errorCode": null
}
```

---

## 💻 Service Methods

The `KnockService` provides the following methods for use in your application:

### 1. Generate Token
```typescript
async generateToken(userId: string): Promise<GenerateKnockTokenDto>
```

### 2. Send In-App Notification
```typescript
async sendInAppNotification(data: SendNotificationDto): Promise<WorkflowResponseDto>
```

### 3. Trigger Custom Workflow
```typescript
async triggerWorkflow(
  workflowKey: string,
  recipients: string[],
  data: Record<string, any>,
  actorId?: string
): Promise<WorkflowResponseDto>
```

### 4. Upsert User
```typescript
async upsertUser(
  userId: string,
  data: { name?: string; email?: string; avatar?: string; [key: string]: any }
): Promise<void>
```

### 5. Get User Preferences
```typescript
async getUserPreferences(userId: string): Promise<any>
```

### 6. Set User Preferences
```typescript
async setUserPreferences(userId: string, preferences: Record<string, any>): Promise<void>
```

### 7. Set Channel Data
```typescript
async setChannelData(
  userId: string,
  channelId: string,
  data: Record<string, any>
): Promise<void>
```

---

## 🔧 Usage Examples

### Example 1: Inject Service in Other Modules

```typescript
import { Injectable } from '@nestjs/common';
import { KnockService } from '@domain/knock/knock.service';

@Injectable()
export class PostService {
  constructor(private readonly knockService: KnockService) {}

  async createPost(userId: string, data: any) {
    // Create post logic...
    const post = await this.prisma.post.create({ data });

    // Notify followers about new post
    await this.knockService.sendInAppNotification({
      recipients: followerIds,
      title: 'New Post',
      text: `${userName} just posted something new`,
      metadata: {
        postId: post.id,
        type: 'new_post',
        url: `/posts/${post.id}`,
      },
      actorId: userId,
    });

    return post;
  }
}
```

### Example 2: Create Custom Workflow

```typescript
import { Injectable } from '@nestjs/common';
import { KnockService } from '@domain/knock/knock.service';

@Injectable()
export class CommentService {
  constructor(private readonly knockService: KnockService) {}

  async createComment(postId: string, userId: string, content: string) {
    // Create comment...
    const comment = await this.prisma.comment.create({
      data: { postId, userId, content },
    });

    // Get post author
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
    });

    // Notify post author about new comment
    await this.knockService.triggerWorkflow(
      'new-comment',  // Your workflow key in Knock
      [post.userId],
      {
        postTitle: post.title,
        commenterName: user.name,
        commentText: content,
        postUrl: `/posts/${postId}`,
      },
      userId
    );

    return comment;
  }
}
```

### Example 3: Set Push Token (Mobile)

```typescript
import { Injectable } from '@nestjs/common';
import { KnockService } from '@domain/knock/knock.service';
import { getKnockPushChannelId } from '@core/config/knock.config';

@Injectable()
export class AuthService {
  constructor(private readonly knockService: KnockService) {}

  async registerPushToken(userId: string, pushToken: string) {
    const pushChannelId = getKnockPushChannelId();

    if (!pushChannelId) {
      throw new Error('Push channel not configured');
    }

    // Set push token for user
    await this.knockService.setChannelData(
      userId,
      pushChannelId,
      {
        tokens: [pushToken],
      }
    );
  }
}
```

### Example 4: User Signup with Knock

```typescript
async function handleUserSignup(userData: any) {
  // 1. Create user in your database
  const user = await userService.create(userData);

  // 2. Create user in Knock
  await knockService.upsertUser(user.id, {
    name: user.name,
    email: user.email,
    avatar: user.avatarUrl,
  });

  // 3. Send welcome notification
  await knockService.sendInAppNotification({
    recipients: [user.id],
    title: 'Welcome to Ventidole!',
    text: 'Thanks for joining us',
    metadata: { type: 'welcome' },
  });

  return user;
}
```

---

## 📱 Client-Side Integration

### React Native Example

```typescript
// 1. Install Knock React Native SDK
npm install @knocklabs/react-native

// 2. Get token from your backend
const getKnockToken = async (jwtToken: string) => {
  const response = await fetch('https://api.com/v1/knock/token', {
    headers: { 'Authorization': `Bearer ${jwtToken}` },
  });
  const { data } = await response.json();
  return data.token;
};

// 3. Initialize Knock in your app
import { KnockProvider, KnockFeedProvider } from '@knocklabs/react-native';

function App() {
  const [knockToken, setKnockToken] = useState(null);

  useEffect(() => {
    getKnockToken(jwtToken).then(setKnockToken);
  }, [jwtToken]);

  if (!knockToken) return <Loading />;

  return (
    <KnockProvider
      apiKey={KNOCK_PUBLIC_API_KEY}
      userId={currentUser.id}
      userToken={knockToken}
    >
      <KnockFeedProvider feedId={KNOCK_FEED_ID}>
        {/* Your app */}
        <NotificationFeed />
      </KnockFeedProvider>
    </KnockProvider>
  );
}
```

---

## 🎯 Creating Workflows in Knock Dashboard

### Step 1: Create Workflow

1. Go to https://dashboard.knock.app/
2. Click **Workflows** → **New Workflow**
3. Give it a name and key (e.g., `new-comment`)
4. Choose channels (in-app, push, email, etc.)

### Step 2: Configure Workflow Steps

1. **Add Steps:** Drag and drop notification steps
2. **Configure Templates:**
   - Use variables: `{{ data.postTitle }}`, `{{ actor.name }}`
   - Add links: `{{ data.postUrl }}`
3. **Set Conditions:** Who receives, when to send, etc.

### Step 3: Test Workflow

```typescript
await knockService.triggerWorkflow(
  'new-comment',
  ['user_123'],
  {
    postTitle: 'My Post',
    commenterName: 'John',
    commentText: 'Great post!',
    postUrl: '/posts/123',
  },
  'commenter_id'
);
```

---

## 🚨 Error Codes

| Error Code | Description |
|------------|-------------|
| `KnockTokenGenerationFailed` | Failed to generate Knock authentication token |
| `KnockNotificationSendFailed` | Failed to send notification |
| `KnockWorkflowTriggerFailed` | Failed to trigger workflow |
| `KnockUserUpsertFailed` | Failed to create/update user in Knock |
| `KnockPreferencesFetchFailed` | Failed to fetch user preferences |
| `KnockPreferencesUpdateFailed` | Failed to update user preferences |
| `KnockChannelDataUpdateFailed` | Failed to update channel data |

---

## 📊 Workflow Ideas

Here are some workflow ideas you can implement:

### User Engagement
- **New Follower:** Notify when someone follows you
- **Post Liked:** Notify when someone likes your post
- **Comment Reply:** Notify when someone replies to your comment
- **Mention:** Notify when someone mentions you

### Community
- **New Community Member:** Welcome new members
- **Community Post:** Notify members about new posts
- **Event Reminder:** Remind about upcoming events

### Moderation
- **Content Reported:** Alert moderators
- **Account Banned:** Notify user
- **Content Removed:** Notify content author

### System
- **Password Changed:** Security notification
- **New Device Login:** Security alert
- **Data Export Ready:** Notify when export is complete

---

## ✅ Setup Checklist

### Backend (Completed ✅)
- [x] Knock SDK installed
- [x] Configuration file created
- [x] Service methods implemented
- [x] Controller endpoints created
- [x] Module registered
- [x] Error codes added
- [x] Environment variables defined
- [x] Build successful

### Knock Dashboard (Todo)
- [ ] Create Knock account
- [ ] Add environment variables to `.env`
- [ ] Create notification channels (in-app, push, email)
- [ ] Create workflows
- [ ] Configure workflow templates
- [ ] Test workflows

### Client Integration (Todo)
- [ ] Install Knock React Native SDK
- [ ] Implement token retrieval
- [ ] Initialize Knock provider
- [ ] Add notification feed UI
- [ ] Test notifications

---

## 🔒 Security Notes

1. **Never expose `KNOCK_SECRET_KEY` to clients**
2. **Use signed tokens** for client-side SDK (via `/knock/token` endpoint)
3. **Validate user identity** before sending notifications
4. **Rate limit** notification endpoints to prevent spam
5. **Log all notification events** for debugging and auditing

---

## 📚 Additional Resources

- **Knock Documentation:** https://docs.knock.app/
- **Knock Dashboard:** https://dashboard.knock.app/
- **Knock React Native SDK:** https://docs.knock.app/sdks/react-native/overview
- **Workflow Builder Guide:** https://docs.knock.app/designing-workflows/overview

---

**Last Updated:** December 8, 2025
**Status:** ✅ Backend Complete | 📱 Ready for Client Integration
