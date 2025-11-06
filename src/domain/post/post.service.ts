import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { FirebaseService } from '@shared/service/firebase/firebase.service';
import { CreatePostRequest, PostVisibility } from './request/create-post.request';
import { CreatePostResponse } from './response/create-post.response';
import * as admin from 'firebase-admin';
import { IRequest } from '@shared/interface/request.interface';
import { getCollection } from '@shared/helper/get-collection';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
  ) {}

  /**
   * Create a new post
   * 
   * Architecture:
   * 1. Get user info from PostgreSQL (source of truth)
   * 2. Create post in Firestore (for real-time features)
   * 3. Update user's post count in PostgreSQL
   * 4. Return complete post data
   */
  async createPost(body: CreatePostRequest, request: IRequest): Promise<CreatePostResponse> {
    try {
      const { posts } = getCollection();
      // 1. Get user information from PostgreSQL (source of truth)
      const user = await this.prisma.account.findUnique({
        where: { id: request.user.id, isActive: true, isDeleted: false },
        select: {
          id: true,
          name: true,
          email: true,
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // 2. Create post in Firestore (for real-time sync)
      const firestore = this.firebaseService.getFirestore();
      const postRef = firestore.collection(posts).doc();
      const postId = postRef.id;

      const now = admin.firestore.FieldValue.serverTimestamp();

      const postData = {
        // User info (denormalized for performance)
        userId: user.id,
        displayName: user.name || 'Unknown User',
        userEmail: user.email,
        userAvatar: null, // TODO: Add avatarUrl field to schema

        // Post content
        content: body.content,
        mediaUrls: body.mediaUrls || [],
        hashtags: body.hashtags || [],
        mentions: body.mentions || [],
        location: body.location || null,
        visibility: body.visibility || PostVisibility.PUBLIC,

        // Counters
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,

        // Timestamps
        createdAt: now,
        updatedAt: now,

        // Status
        isDeleted: false,
      };

      await postRef.set(postData);

      // 3. Update user's post count in PostgreSQL (optional - skip for now)
      // TODO: Add postsCount field to Account schema to enable this
      // await this.prisma.account.update({
      //   where: { id: userId },
      //   data: { postsCount: { increment: 1 } },
      // });

      // 4. Send notifications to mentioned users (async - don't wait)
      if (body.mentions && body.mentions.length > 0) {
        this.sendMentionNotifications(request.user.id, postId, body.mentions).catch((error) => {
          this.logger.error('Failed to send mention notifications', error);
        });
      }

      this.logger.log(`Post created: ${postId} by user ${request.user.id}`);

      // 5. Return response
      return {
        postId,
        userId: user.id,
        username: user.name || 'unknown', // TODO: Add username field to schema
        displayName: user.name || 'Unknown User',
        userAvatar: undefined, // TODO: Add avatarUrl field to schema
        content: body.content,
        mediaUrls: body.mediaUrls || [],
        hashtags: body.hashtags || [],
        mentions: body.mentions || [],
        location: body.location,
        createdAt: new Date(),
        counters: {
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
        },
      };
    } catch (error) {
      this.logger.error('Failed to create post', error);
      throw error;
    }
  }

  /**
   * Send notifications to mentioned users
   * This runs asynchronously and doesn't block post creation
   */
  private async sendMentionNotifications(
    authorId: string,
    postId: string,
    mentionedUserIds: string[],
  ): Promise<void> {
    try {
      const { notifications } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Get author info
      const author = await this.prisma.account.findUnique({
        where: { id: authorId },
        select: { id: true, name: true, email: true },
      });

      if (!author) return;

      // Create notification for each mentioned user
      const notificationPayload = mentionedUserIds.map((userId) => {
        return firestore.collection(notifications).add({
          userId,
          actorId: authorId,
          actorName: author.name || 'Unknown',
          actorAvatar: null, // TODO: Add avatarUrl field to schema
          type: 'mention',
          contentId: postId,
          contentType: 'post',
          message: `${author.name || 'Someone'} mentioned you in a post`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await Promise.all(notificationPayload);

      this.logger.log(`Sent ${mentionedUserIds.length} mention notifications for post ${postId}`);
    } catch (error) {
      this.logger.error('Failed to send mention notifications', error);
    }
  }
}