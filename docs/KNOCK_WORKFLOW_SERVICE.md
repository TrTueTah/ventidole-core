# Knock Workflow Service

## Overview

The `KnockWorkflowService` is a global shared service that provides reusable notification workflows across your entire application. It's located in `src/shared/service/knock-workflow/` and is automatically available to all modules without explicit imports.

## Architecture

```
src/shared/service/knock-workflow/
├── knock-workflow.service.ts    # Service with workflow methods
└── knock-workflow.module.ts     # Global module definition
```

The module is registered as `@Global()` in [AppModule](../src/app.module.ts), making `KnockWorkflowService` injectable anywhere in your application.

---

## Key Features

✅ **Global Service** - Automatically available in all modules
✅ **Type-Safe** - Strong TypeScript interfaces for all workflows
✅ **Consistent** - Standardized notification patterns across your app
✅ **Reusable** - Pre-built workflows for common scenarios
✅ **Extensible** - Easy to add custom workflows

---

## Usage in Your Services

### Injecting the Service

Simply inject `KnockWorkflowService` in any service:

```typescript
import { Injectable } from '@nestjs/common';
import { KnockWorkflowService } from '@shared/service/knock-workflow/knock-workflow.service';

@Injectable()
export class PostService {
  constructor(
    private readonly knockWorkflowService: KnockWorkflowService,
  ) {}

  async createPost(userId: string, data: any) {
    // Your business logic...
    const post = await this.prisma.post.create({ data });

    // Send notification to followers
    await this.knockWorkflowService.notifyNewPost({
      followerIds: followerIds,
      postId: post.id,
      postTitle: post.title,
      postExcerpt: post.excerpt,
      author: {
        id: userId,
        name: user.name,
        avatar: user.avatarUrl,
      },
    });

    return post;
  }
}
```

---

## Available Workflows

### 1. User Engagement Workflows

#### New Follower Notification

```typescript
await knockWorkflowService.notifyNewFollower({
  userId: 'user_123',
  follower: {
    id: 'follower_456',
    name: 'John Doe',
    avatar: 'https://example.com/avatar.jpg',
  },
  metadata: {
    url: '/profile/follower_456',
  },
});
```

**Workflow Key:** `new-follower`

#### Post Liked Notification

```typescript
await knockWorkflowService.notifyPostLiked({
  postAuthorId: 'author_123',
  postId: 'post_456',
  postTitle: 'My Amazing Post',
  liker: {
    id: 'liker_789',
    name: 'Jane Smith',
    avatar: 'https://example.com/avatar.jpg',
  },
});
```

**Workflow Key:** `post-liked`

#### New Comment Notification

```typescript
await knockWorkflowService.notifyNewComment({
  postAuthorId: 'author_123',
  postId: 'post_456',
  postTitle: 'My Amazing Post',
  commentId: 'comment_789',
  commentText: 'Great post!',
  commenter: {
    id: 'commenter_abc',
    name: 'Bob Johnson',
    avatar: 'https://example.com/avatar.jpg',
  },
});
```

**Workflow Key:** `new-comment`

#### Comment Reply Notification

```typescript
await knockWorkflowService.notifyCommentReply({
  originalCommenterId: 'commenter_123',
  postId: 'post_456',
  commentId: 'comment_789',
  replyText: 'Thanks for your comment!',
  replier: {
    id: 'replier_abc',
    name: 'Alice Brown',
  },
});
```

**Workflow Key:** `comment-reply`

#### User Mention Notification

```typescript
await knockWorkflowService.notifyUserMention({
  mentionedUserId: 'user_123',
  postId: 'post_456',
  commentId: 'comment_789',
  text: 'Hey @user_123, check this out!',
  mentioner: {
    id: 'mentioner_abc',
    name: 'Charlie Davis',
  },
});
```

**Workflow Key:** `user-mention`

---

### 2. Content Publishing Workflows

#### New Post to Followers

```typescript
await knockWorkflowService.notifyNewPost({
  followerIds: ['user_1', 'user_2', 'user_3'],
  postId: 'post_456',
  postTitle: 'My New Blog Post',
  postExcerpt: 'This is an exciting new post about...',
  author: {
    id: 'author_123',
    name: 'Emma Wilson',
    avatar: 'https://example.com/avatar.jpg',
  },
});
```

**Workflow Key:** `new-post`

---

### 3. Community Workflows

#### Community Invitation

```typescript
await knockWorkflowService.notifyCommunityInvite({
  userId: 'user_123',
  communityId: 'community_456',
  communityName: 'Tech Enthusiasts',
  inviter: {
    id: 'inviter_789',
    name: 'Frank Miller',
  },
});
```

**Workflow Key:** `community-invite`

#### Community New Post

```typescript
await knockWorkflowService.notifyCommunityNewPost({
  memberIds: ['member_1', 'member_2', 'member_3'],
  communityId: 'community_456',
  communityName: 'Tech Enthusiasts',
  postId: 'post_789',
  postTitle: 'New Discussion Topic',
  author: {
    id: 'author_123',
    name: 'Grace Lee',
  },
});
```

**Workflow Key:** `community-new-post`

---

### 4. User Lifecycle Workflows

#### Welcome New User

```typescript
await knockWorkflowService.notifyWelcome({
  userId: 'new_user_123',
  userName: 'Henry Taylor',
  metadata: {
    url: '/getting-started',
  },
});
```

**Workflow Key:** `welcome`

---

### 5. Security Workflows

#### Password Changed

```typescript
await knockWorkflowService.notifyPasswordChanged({
  userId: 'user_123',
});
```

**Workflow Key:** `password-changed`

#### New Device Login

```typescript
await knockWorkflowService.notifyNewDeviceLogin({
  userId: 'user_123',
  deviceInfo: {
    device: 'iPhone 15 Pro',
    location: 'San Francisco, CA',
    ip: '192.168.1.1',
  },
});
```

**Workflow Key:** `new-device-login`

---

### 6. Moderation Workflows

#### Content Reported

```typescript
await knockWorkflowService.notifyContentReported({
  moderatorIds: ['mod_1', 'mod_2'],
  contentType: 'post',
  contentId: 'post_123',
  reportReason: 'Spam content',
  reporter: {
    id: 'reporter_456',
    name: 'Ivy Anderson',
  },
});
```

**Workflow Key:** `content-reported`

#### Account Action

```typescript
await knockWorkflowService.notifyAccountAction({
  userId: 'user_123',
  action: 'warned',
  reason: 'Violation of community guidelines',
});
```

**Workflow Key:** `account-action`
**Actions:** `banned`, `warned`, `unbanned`

#### Content Removed

```typescript
await knockWorkflowService.notifyContentRemoved({
  userId: 'user_123',
  contentType: 'post',
  contentTitle: 'My Post Title',
  reason: 'Violates community guidelines',
});
```

**Workflow Key:** `content-removed`

---

## Complete Integration Examples

### Example 1: Post Service with Notifications

```typescript
import { Injectable } from '@nestjs/common';
import { KnockWorkflowService } from '@shared/service/knock-workflow/knock-workflow.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';

@Injectable()
export class PostService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knockWorkflowService: KnockWorkflowService,
  ) {}

  async createPost(userId: string, createPostDto: CreatePostDto) {
    // 1. Get user data
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        followers: { select: { followerId: true } },
      },
    });

    // 2. Create post
    const post = await this.prisma.post.create({
      data: {
        ...createPostDto,
        userId,
      },
    });

    // 3. Notify followers
    const followerIds = user.followers.map((f) => f.followerId);

    if (followerIds.length > 0) {
      await this.knockWorkflowService.notifyNewPost({
        followerIds,
        postId: post.id,
        postTitle: post.title,
        postExcerpt: post.content.substring(0, 100),
        author: {
          id: user.id,
          name: user.name,
          avatar: user.avatarUrl,
        },
      });
    }

    return post;
  }

  async likePost(userId: string, postId: string) {
    // 1. Create like
    const like = await this.prisma.like.create({
      data: { userId, postId },
    });

    // 2. Get post and user data
    const [post, user] = await Promise.all([
      this.prisma.post.findUnique({ where: { id: postId } }),
      this.prisma.user.findUnique({ where: { id: userId } }),
    ]);

    // 3. Notify post author (don't notify if liking own post)
    if (post.userId !== userId) {
      await this.knockWorkflowService.notifyPostLiked({
        postAuthorId: post.userId,
        postId: post.id,
        postTitle: post.title,
        liker: {
          id: user.id,
          name: user.name,
          avatar: user.avatarUrl,
        },
      });
    }

    return like;
  }
}
```

### Example 2: Comment Service with Notifications

```typescript
import { Injectable } from '@nestjs/common';
import { KnockWorkflowService } from '@shared/service/knock-workflow/knock-workflow.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly knockWorkflowService: KnockWorkflowService,
  ) {}

  async createComment(userId: string, createCommentDto: CreateCommentDto) {
    const { postId, content, parentId } = createCommentDto;

    // 1. Create comment
    const comment = await this.prisma.comment.create({
      data: {
        content,
        userId,
        postId,
        parentId,
      },
    });

    // 2. Get user and post data
    const [user, post] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: userId } }),
      this.prisma.post.findUnique({ where: { id: postId } }),
    ]);

    // 3. Send appropriate notification
    if (parentId) {
      // This is a reply to another comment
      const parentComment = await this.prisma.comment.findUnique({
        where: { id: parentId },
      });

      if (parentComment.userId !== userId) {
        await this.knockWorkflowService.notifyCommentReply({
          originalCommenterId: parentComment.userId,
          postId,
          commentId: comment.id,
          replyText: content,
          replier: {
            id: user.id,
            name: user.name,
            avatar: user.avatarUrl,
          },
        });
      }
    } else {
      // This is a new comment on a post
      if (post.userId !== userId) {
        await this.knockWorkflowService.notifyNewComment({
          postAuthorId: post.userId,
          postId: post.id,
          postTitle: post.title,
          commentId: comment.id,
          commentText: content,
          commenter: {
            id: user.id,
            name: user.name,
            avatar: user.avatarUrl,
          },
        });
      }
    }

    // 4. Check for mentions in content
    const mentions = this.extractMentions(content);
    if (mentions.length > 0) {
      for (const mentionedUsername of mentions) {
        const mentionedUser = await this.prisma.user.findUnique({
          where: { username: mentionedUsername },
        });

        if (mentionedUser && mentionedUser.id !== userId) {
          await this.knockWorkflowService.notifyUserMention({
            mentionedUserId: mentionedUser.id,
            postId,
            commentId: comment.id,
            text: content,
            mentioner: {
              id: user.id,
              name: user.name,
              avatar: user.avatarUrl,
            },
          });
        }
      }
    }

    return comment;
  }

  private extractMentions(text: string): string[] {
    const mentionRegex = /@(\w+)/g;
    const matches = text.matchAll(mentionRegex);
    return Array.from(matches, (m) => m[1]);
  }
}
```

### Example 3: Auth Service with Security Notifications

```typescript
import { Injectable } from '@nestjs/common';
import { KnockWorkflowService } from '@shared/service/knock-workflow/knock-workflow.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly knockWorkflowService: KnockWorkflowService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Create user...
    const user = await this.prisma.user.create({
      data: registerDto,
    });

    // Send welcome notification
    await this.knockWorkflowService.notifyWelcome({
      userId: user.id,
      userName: user.name,
    });

    return user;
  }

  async changePassword(userId: string, newPassword: string) {
    // Update password...
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Send security notification
    await this.knockWorkflowService.notifyPasswordChanged({
      userId,
    });
  }

  async login(userId: string, deviceInfo: any) {
    // Check if this is a new device
    const isNewDevice = await this.isNewDevice(userId, deviceInfo);

    if (isNewDevice) {
      // Send security alert
      await this.knockWorkflowService.notifyNewDeviceLogin({
        userId,
        deviceInfo: {
          device: deviceInfo.userAgent,
          location: deviceInfo.location,
          ip: deviceInfo.ip,
        },
      });
    }

    // Continue login...
  }
}
```

---

## Creating Custom Workflows

### Step 1: Add Method to Service

Edit [knock-workflow.service.ts](../src/shared/service/knock-workflow/knock-workflow.service.ts):

```typescript
/**
 * Notify user about event reminder
 */
async notifyEventReminder(params: {
  userId: string;
  eventId: string;
  eventTitle: string;
  eventTime: string;
  metadata?: NotificationMetadata;
}): Promise<string> {
  return this.triggerWorkflow(
    'event-reminder',
    [params.userId],
    {
      eventId: params.eventId,
      eventTitle: params.eventTitle,
      eventTime: params.eventTime,
      url: params.metadata?.url || `/events/${params.eventId}`,
      ...params.metadata,
    },
    { id: 'system', name: 'Events' },
  );
}
```

### Step 2: Create Workflow in Knock Dashboard

1. Go to https://dashboard.knock.app/
2. Click **Workflows** → **New Workflow**
3. Set workflow key to `event-reminder`
4. Configure channels (in-app, push, email)
5. Set up templates with variables:
   - `{{ data.eventTitle }}`
   - `{{ data.eventTime }}`
   - `{{ data.url }}`

### Step 3: Use in Your Service

```typescript
await this.knockWorkflowService.notifyEventReminder({
  userId: 'user_123',
  eventId: 'event_456',
  eventTitle: 'Team Meeting',
  eventTime: '2025-12-09 10:00 AM',
});
```

---

## Workflow Variables Reference

All workflows have access to these common variables:

### Actor Variables
- `{{ actor.id }}` - ID of the user who triggered the action
- `{{ actor.name }}` - Name of the user who triggered the action
- `{{ actor.avatar }}` - Avatar URL of the user who triggered the action

### Data Variables
Each workflow has specific data variables (see workflow documentation above).

### System Variables
- `{{ recipient.id }}` - ID of the notification recipient
- `{{ recipient.name }}` - Name of the notification recipient
- `{{ recipient.email }}` - Email of the notification recipient

---

## Error Handling

All workflow methods handle errors gracefully and throw `CustomError` with appropriate error codes:

```typescript
try {
  await this.knockWorkflowService.notifyNewPost({...});
} catch (error) {
  if (error.errorCode === ErrorCode.KnockWorkflowTriggerFailed) {
    // Handle workflow failure
    this.logger.error('Failed to send notification');
  }
}
```

---

## Best Practices

### 1. Don't Block User Actions

Run notifications asynchronously:

```typescript
// ✅ Good - don't await
this.knockWorkflowService.notifyNewPost({...}).catch(err =>
  this.logger.error('Notification failed', err)
);

return post; // Return immediately
```

```typescript
// ❌ Bad - blocks user
await this.knockWorkflowService.notifyNewPost({...});
return post;
```

### 2. Check Empty Recipients

The service handles empty arrays gracefully, but be explicit:

```typescript
if (followerIds.length > 0) {
  await this.knockWorkflowService.notifyNewPost({
    followerIds,
    // ...
  });
}
```

### 3. Avoid Self-Notifications

```typescript
// Don't notify users about their own actions
if (post.userId !== currentUserId) {
  await this.knockWorkflowService.notifyPostLiked({...});
}
```

### 4. Use Metadata for Extra Context

```typescript
await this.knockWorkflowService.notifyNewComment({
  // ... required params
  metadata: {
    url: `/posts/${postId}#comment-${commentId}`,
    type: 'comment',
    priority: 'high',
    customField: 'custom value',
  },
});
```

---

## Workflow Summary Table

| Workflow | Key | Use Case |
|----------|-----|----------|
| New Follower | `new-follower` | User gains a new follower |
| Post Liked | `post-liked` | Someone likes a user's post |
| New Comment | `new-comment` | Someone comments on a user's post |
| Comment Reply | `comment-reply` | Someone replies to a user's comment |
| User Mention | `user-mention` | User is mentioned in content |
| New Post | `new-post` | Notify followers of new post |
| Community Invite | `community-invite` | User invited to community |
| Community New Post | `community-new-post` | New post in community |
| Welcome | `welcome` | New user signup |
| Password Changed | `password-changed` | User password changed |
| New Device Login | `new-device-login` | Login from new device |
| Content Reported | `content-reported` | Content reported by user |
| Account Action | `account-action` | Account banned/warned/unbanned |
| Content Removed | `content-removed` | User's content removed |

---

## Related Documentation

- [Knock Integration Guide](./KNOCK_INTEGRATION.md) - Main Knock setup documentation
- [Knock Official Docs](https://docs.knock.app/) - Official Knock documentation
- [Creating Workflows](https://docs.knock.app/designing-workflows/overview) - Knock workflow builder guide

---

**Last Updated:** December 8, 2025
**Status:** ✅ Ready for Use
