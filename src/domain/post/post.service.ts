import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { FirebaseService } from '@shared/service/firebase/firebase.service';
import { CreatePostRequest, PostVisibility } from './request/create-post.request';
import { CreatePostResponse } from './response/create-post.response';
import { GetPostResponse, PostDto } from './response/get-post.response';
import { GetPostsResponse } from './response/get-posts.response';
import { UpdatePostResponse } from './response/update-post.response';
import { DeletePostResponse } from './response/delete-post.response';
import { UpdatePostRequest } from './request/update-post.request';
import { GetPostsRequest, PostAuthorFilter } from './request/get-posts.request';
import { PageInfo, PaginationResponse } from '@shared/dto/pagination-response.dto';
import { BaseResponse } from '@shared/helper/response';
import { Role } from 'src/db/prisma/enums';
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
   * Architecture (Updated - Unified Media Storage):
   * 1. Verify user exists and get communityId from PostgreSQL (source of truth)
   * 2. Create post in Firestore with userId and communityId (no media URLs in post doc)
   * 3. Store media in separate post_media collection for better organization
   * 4. User info and media will be fetched fresh when retrieving posts
   * 5. Return complete post data with user info and media
   */
  async createPost(body: CreatePostRequest, request: IRequest): Promise<BaseResponse<CreatePostResponse>> {
    try {
      const { posts } = getCollection();
      // 1. Verify user exists and get their community (source of truth check)
      const user = await this.prisma.user.findUnique({
        where: { id: request.user.id, isActive: true, isDeleted: false },
        select: {
          id: true,
          idol: {
            select: {
              communityId: true,
            },
          },
        },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Get communityId - for idols, use their community; for fans, we need to get from followers
      let communityId: string | null = null;

      if (user.idol?.communityId) {
        // User is an idol, use their community
        communityId = user.idol.communityId;
      } else {
        // User is a fan, get the first community they follow
        const communityFollower = await this.prisma.communityFollower.findFirst({
          where: {
            userId: request.user.id,
            isDeleted: false,
            isActive: true,
          },
          select: {
            communityId: true,
          },
        });

        communityId = communityFollower?.communityId || null;
      }

      if (!communityId) {
        throw new BadRequestException('User must be part of a community to create posts');
      }

      // 2. Create post in Firestore (for real-time sync)
      const firestore = this.firebaseService.getFirestore();
      const postRef = firestore.collection(posts).doc();
      const postId = postRef.id;

      const now = admin.firestore.FieldValue.serverTimestamp();

      const postData = {
        // ONLY store userId and communityId
        userId: request.user.id,
        communityId: communityId,

        // Post content
        content: body.content,
        contentType: this.determineContentType(body.content, body.mediaUrls),
        hashtags: body.hashtags || [],
        location: body.location || null,
        visibility: body.visibility || PostVisibility.PUBLIC,

        // Media count (media stored in separate collection)
        mediaCount: body.mediaUrls ? body.mediaUrls.length : 0,

        // Counters
        likesCount: 0,
        commentsCount: 0,
        sharesCount: 0,
        viewsCount: 0,

        // Timestamps
        createdAt: now,
        updatedAt: now,

        // Status
        isDeleted: false,
      };

      await postRef.set(postData);

      // Store media in separate collection
      if (body.mediaUrls && body.mediaUrls.length > 0) {
        await this.createPostMedia(postId, body.mediaUrls, request.user.id);
      }

      // 3. Send notifications to community members if post is from an idol (async - don't wait)
      if (request.user.role === 'IDOL') {
        this.sendIdolPostNotifications(request.user.id, postId).catch((error) => {
          this.logger.error('Failed to send idol post notifications', error);
        });
      }

      this.logger.log(`Post created: ${postId} by user ${request.user.id}`);

      // 5. Fetch fresh user info and return complete response
      const userInfo = await this.getUserInfo(request.user.id);

      const response: CreatePostResponse = {
        postId,
        communityId,
        userId: request.user.id,
        username: userInfo.username,
        displayName: userInfo.displayName,
        userAvatar: userInfo.avatarUrl || undefined,
        content: body.content,
        mediaUrls: body.mediaUrls || [],
        hashtags: body.hashtags || [],
        location: body.location,
        createdAt: new Date(),
        counters: {
          likesCount: 0,
          commentsCount: 0,
          sharesCount: 0,
        },
      };

      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error('Failed to create post', error);
      throw error;
    }
  }

  /**
   * Get a single post by ID
   */
  async getPost(postId: string, request: IRequest): Promise<BaseResponse<GetPostResponse>> {
    try {
      const { posts } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Get post from Firestore
      const postDoc = await firestore.collection(posts).doc(postId).get();

      if (!postDoc.exists) {
        throw new NotFoundException('Post not found');
      }

      const postData = postDoc.data();

      if (!postData) {
        throw new NotFoundException('Post not found');
      }

      // Check if post is deleted
      if (postData.isDeleted) {
        throw new NotFoundException('Post not found');
      }

      // Check visibility permissions
      if (postData.visibility === PostVisibility.PRIVATE && postData.userId !== request.user.id) {
        throw new ForbiddenException('You do not have permission to view this post');
      }

      // Map Firestore data to response DTO with fresh user info
      const response = await this.mapPostToDto(postId, postData);
      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error(`Failed to get post ${postId}`, error);
      throw error;
    }
  }

  /**
   * Get posts with pagination and filtering
   */
  async getPosts(query: GetPostsRequest, request: IRequest): Promise<PaginationResponse<PostDto>> {
    try {
      const { posts } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Build query
      let firestoreQuery: admin.firestore.Query = firestore.collection(posts);

      // Filter by userId if provided
      if (query.userId) {
        firestoreQuery = firestoreQuery.where('userId', '==', query.userId);
      }

      // Filter by visibility (only get public posts or user's own posts)
      if (query.visibility) {
        firestoreQuery = firestoreQuery.where('visibility', '==', query.visibility);
      } else {
        // Default: only show public posts or user's own posts
        firestoreQuery = firestoreQuery.where('visibility', '==', PostVisibility.PUBLIC);
      }

      // Filter by hashtag if provided
      if (query.hashtag) {
        firestoreQuery = firestoreQuery.where('hashtags', 'array-contains', query.hashtag);
      }

      // Filter out deleted posts
      firestoreQuery = firestoreQuery.where('isDeleted', '==', false);

      // Sort
      const sortField = query.sortBy || 'createdAt';
      const sortDirection = query.sortOrder || 'desc';
      firestoreQuery = firestoreQuery.orderBy(sortField, sortDirection);

      // Get total count for pagination
      const countSnapshot = await firestoreQuery.count().get();
      const total = countSnapshot.data().count;

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 20;

      firestoreQuery = firestoreQuery.offset(offset).limit(limit);

      // Execute query
      const snapshot = await firestoreQuery.get();

      // Map results - fetch user info for each post in parallel for performance
      const postsData: PostDto[] = await Promise.all(
        snapshot.docs.map((doc) => this.mapPostToDto(doc.id, doc.data()))
      );

      // Build pagination response using PaginationResponse.of()
      return PaginationResponse.of(
        new PaginationResponse(postsData, new PageInfo(query.page, query.limit, total))
      );
    } catch (error) {
      this.logger.error('Failed to get posts', error);
      throw error;
    }
  }

  /**
   * Get posts from a specific community
   * Supports filtering by author role (idol, fan, or all)
   */
  async getPostsByCommunity(communityId: string, query: GetPostsRequest, request: IRequest): Promise<PaginationResponse<PostDto>> {
    try {
      // 1. Verify community exists and get members
      const community = await this.prisma.community.findFirst({
        where: {
          id: communityId,
          isActive: true,
          isDeleted: false,
        },
        select: {
          id: true,
          idols: {
            select: {
              userId: true,
            },
          },
          followers: {
            where: {
              isDeleted: false,
            },
            select: {
              userId: true,
            },
          },
        },
      });

      if (!community) {
        throw new NotFoundException('Community not found');
      }

      // 2. Get user IDs based on author filter
      const idolUserIds = community.idols.map(idol => idol.userId);
      const fanUserIds = community.followers.map(follower => follower.userId);

      let targetUserIds: string[] = [];
      const authorFilter = query.authorFilter || PostAuthorFilter.ALL;

      if (authorFilter === PostAuthorFilter.IDOL) {
        targetUserIds = idolUserIds;
      } else if (authorFilter === PostAuthorFilter.FAN) {
        targetUserIds = fanUserIds;
      } else {
        // ALL: combine both idols and fans
        targetUserIds = [...new Set([...idolUserIds, ...fanUserIds])];
      }

      if (targetUserIds.length === 0) {
        // No users in this filter, return empty result
        return PaginationResponse.of(
          new PaginationResponse([], new PageInfo(query.page || 1, query.limit || 20, 0))
        );
      }

      // 3. Query Firestore for posts from these users
      const { posts } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Note: Firestore 'in' operator supports up to 10 values
      // For communities with more than 10 users, we need to batch the queries
      const batchSize = 10;
      const userBatches: string[][] = [];
      for (let i = 0; i < targetUserIds.length; i += batchSize) {
        userBatches.push(targetUserIds.slice(i, i + batchSize));
      }

      // Execute queries for each batch in parallel
      const allPostsPromises = userBatches.map(async (batch) => {
        let firestoreQuery: admin.firestore.Query = firestore.collection(posts);

        // Filter by user IDs in this batch
        firestoreQuery = firestoreQuery.where('userId', 'in', batch);

        // Filter by visibility (only public posts or user's own posts)
        if (query.visibility) {
          firestoreQuery = firestoreQuery.where('visibility', '==', query.visibility);
        } else {
          firestoreQuery = firestoreQuery.where('visibility', '==', PostVisibility.PUBLIC);
        }

        // Filter by hashtag if provided
        if (query.hashtag) {
          firestoreQuery = firestoreQuery.where('hashtags', 'array-contains', query.hashtag);
        }

        // Filter out deleted posts
        firestoreQuery = firestoreQuery.where('isDeleted', '==', false);

        // Sort
        const sortField = query.sortBy || 'createdAt';
        const sortDirection = query.sortOrder || 'desc';
        firestoreQuery = firestoreQuery.orderBy(sortField, sortDirection);

        const snapshot = await firestoreQuery.get();
        return snapshot.docs.map(doc => ({ id: doc.id, data: doc.data() }));
      });

      const batchResults = await Promise.all(allPostsPromises);
      const allPosts = batchResults.flat();

      // Sort all posts by the sort field
      const sortField = query.sortBy || 'createdAt';
      const sortDirection = query.sortOrder || 'desc';
      allPosts.sort((a, b) => {
        const aValue = a.data[sortField];
        const bValue = b.data[sortField];

        // Handle Firestore timestamps
        const aTime = aValue?.toDate?.() || aValue;
        const bTime = bValue?.toDate?.() || bValue;

        if (sortDirection === 'desc') {
          return bTime > aTime ? 1 : -1;
        } else {
          return aTime > bTime ? 1 : -1;
        }
      });

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 20;
      const total = allPosts.length;
      const paginatedPosts = allPosts.slice(offset, offset + limit);

      // Map results - fetch user info for each post in parallel
      const postsData: PostDto[] = await Promise.all(
        paginatedPosts.map((post) => this.mapPostToDto(post.id, post.data))
      );

      return PaginationResponse.of(
        new PaginationResponse(postsData, new PageInfo(query.page || 1, query.limit || 20, total))
      );
    } catch (error) {
      this.logger.error(`Failed to get posts for community ${communityId}`, error);
      throw error;
    }
  }

  /**
   * Update a post
   */
  async updatePost(
    postId: string,
    body: UpdatePostRequest,
    request: IRequest,
  ): Promise<BaseResponse<UpdatePostResponse>> {
    try {
      const { posts } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Get post to verify ownership
      const postRef = firestore.collection(posts).doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        throw new NotFoundException('Post not found');
      }

      const postData = postDoc.data();

      if (!postData) {
        throw new NotFoundException('Post not found');
      }

      // Check ownership
      if (postData.userId !== request.user.id) {
        throw new ForbiddenException('You do not have permission to update this post');
      }

      // Check if post is deleted
      if (postData.isDeleted) {
        throw new BadRequestException('Cannot update a deleted post');
      }

      // Build update data
      const updateData: any = {
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      if (body.content !== undefined) updateData.content = body.content;
      if (body.hashtags !== undefined) updateData.hashtags = body.hashtags;
      if (body.location !== undefined) updateData.location = body.location;
      if (body.visibility !== undefined) updateData.visibility = body.visibility;

      // Handle media updates separately in post_media collection
      if (body.mediaUrls !== undefined) {
        // Delete existing media
        await this.deletePostMedia(postId);

        // Create new media if provided
        if (body.mediaUrls.length > 0) {
          await this.createPostMedia(postId, body.mediaUrls, request.user.id);
        }

        // Update media count
        updateData.mediaCount = body.mediaUrls.length;
      }

      // Update in Firestore
      await postRef.update(updateData);

      this.logger.log(`Post updated: ${postId} by user ${request.user.id}`);

      const response: UpdatePostResponse = {
        postId,
        message: 'Post updated successfully',
        updatedAt: new Date(),
      };

      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error(`Failed to update post ${postId}`, error);
      throw error;
    }
  }

  /**
   * Delete a post (soft delete)
   */
  async deletePost(postId: string, request: IRequest): Promise<BaseResponse<DeletePostResponse>> {
    try {
      const { posts } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Get post to verify ownership
      const postRef = firestore.collection(posts).doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists) {
        throw new NotFoundException('Post not found');
      }

      const postData = postDoc.data();

      if (!postData) {
        throw new NotFoundException('Post not found');
      }

      // Check ownership (admins can delete any post)
      if (postData.userId !== request.user.id && request.user.role !== 'ADMIN') {
        throw new ForbiddenException('You do not have permission to delete this post');
      }

      // Check if already deleted
      if (postData.isDeleted) {
        throw new BadRequestException('Post is already deleted');
      }

      // Soft delete
      await postRef.update({
        isDeleted: true,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      this.logger.log(`Post deleted: ${postId} by user ${request.user.id}`);

      const response: DeletePostResponse = {
        postId,
        message: 'Post deleted successfully',
        deletedAt: new Date(),
      };

      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error(`Failed to delete post ${postId}`, error);
      throw error;
    }
  }

  /**
   * Get user display information from PostgreSQL (single source of truth)
   * This ensures user data is always fresh and up-to-date
   */
  private async getUserInfo(userId: string): Promise<{
    username: string;
    displayName: string;
    avatarUrl: string | null;
    email: string;
  }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        avatarUrl: true,
        idol: {
          select: {
            stageName: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!user) {
      return {
        username: 'unknown',
        displayName: 'Unknown User',
        avatarUrl: null,
        email: '',
      };
    }

    // For idols, use stageName, otherwise use email as username
    const username = user.idol?.stageName || user.email.split('@')[0];
    const displayName = user.idol?.stageName || user.email.split('@')[0];
    // Prioritize idol avatar, then user avatar
    const avatarUrl = user.idol?.avatarUrl || user.avatarUrl || null;

    return {
      username,
      displayName,
      avatarUrl,
      email: user.email,
    };
  }

  /**
   * Map Firestore post data to DTO with fresh user info from PostgreSQL
   */
  private async mapPostToDto(postId: string, data: any): Promise<PostDto> {
    // Fetch fresh user info from PostgreSQL (single source of truth)
    const userInfo = await this.getUserInfo(data.userId);

    // Fetch media from post_media collection
    const media = await this.getPostMedia(postId);
    console.log('Media for post', postId, media);
    let mediaUrls = media.map(m => m.url);

    // Fallback: If no media found in post_media collection but mediaUrls exists in post document (old structure)
    // This handles backward compatibility during migration
    if (mediaUrls.length === 0 && data.mediaUrls && Array.isArray(data.mediaUrls)) {
      mediaUrls = data.mediaUrls;
      this.logger.warn(`Post ${postId} using legacy mediaUrls from post document. Consider running migration.`);
    }

    return {
      postId,
      communityId: data.communityId,
      userId: data.userId,
      displayName: userInfo.displayName,
      userEmail: userInfo.email,
      userAvatar: userInfo.avatarUrl || undefined,
      content: data.content,
      mediaUrls: mediaUrls,
      hashtags: data.hashtags || [],
      location: data.location,
      visibility: data.visibility,
      likesCount: data.likesCount || 0,
      commentsCount: data.commentsCount || 0,
      sharesCount: data.sharesCount || 0,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      isDeleted: data.isDeleted || false,
    };
  }

  /**
   * Send notifications to all community members when idol creates a post
   * This runs asynchronously and doesn't block post creation
   */
  private async sendIdolPostNotifications(
    idolUserId: string,
    postId: string,
  ): Promise<void> {
    try {
      const { notifications } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Get idol (user with IDOL role) info and their community
      const idol = await this.prisma.user.findUnique({
        where: { id: idolUserId, role: Role.IDOL },
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          communityId: true,
          community: {
            select: {
              name: true,
              followers: {
                where: {
                  isActive: true,
                },
                select: {
                  userId: true,
                },
              },
            },
          },
        },
      });

      if (!idol || !idol.community || !idol.community.followers.length) {
        this.logger.log(`No followers found for idol ${idolUserId}`);
        return;
      }

      // Get all follower user IDs
      const followerUserIds = idol.community.followers.map(f => f.userId);

      // Create notification for each follower
      const notificationPromises = followerUserIds.map((userId) => {
        return firestore.collection(notifications).add({
          userId,
          actorId: idolUserId,
          actorName: idol.username,
          actorAvatar: idol.avatarUrl || null,
          type: 'idol_post',
          contentId: postId,
          contentType: 'post',
          message: `${idol.username} posted in ${idol.community.name}`,
          read: false,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await Promise.all(notificationPromises);

      this.logger.log(`Sent ${followerUserIds.length} idol post notifications for post ${postId}`);
    } catch (error) {
      this.logger.error('Failed to send idol post notifications', error);
    }
  }

  /**
   * Create post media in separate collection
   */
  private async createPostMedia(postId: string, mediaUrls: string[], uploadedBy: string): Promise<void> {
    try {
      const { postMedia } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      const mediaPromises = mediaUrls.map((url, index) => {
        return firestore.collection(postMedia).add({
          postId,
          url,
          type: this.detectMediaType(url),
          order: index,
          uploadedBy,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      await Promise.all(mediaPromises);
      this.logger.log(`Created ${mediaUrls.length} media items for post ${postId}`);
    } catch (error) {
      this.logger.error(`Failed to create post media for post ${postId}`, error);
      throw error;
    }
  }

  /**
   * Get post media from separate collection
   */
  private async getPostMedia(postId: string): Promise<Array<{
    id: string;
    url: string;
    type: string;
    order: number;
  }>> {
    try {
      const { postMedia } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      const snapshot = await firestore
        .collection(postMedia)
        .where('postId', '==', postId)
        .orderBy('order', 'asc')
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          url: data.url,
          type: data.type,
          order: data.order,
        };
      });
    } catch (error) {
      this.logger.error(`Failed to get media for post ${postId}`, error);
      return [];
    }
  }

  /**
   * Delete all media for a post from separate collection
   */
  private async deletePostMedia(postId: string): Promise<void> {
    try {
      const { postMedia } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      const snapshot = await firestore
        .collection(postMedia)
        .where('postId', '==', postId)
        .get();

      const deletePromises = snapshot.docs.map((doc) => doc.ref.delete());
      await Promise.all(deletePromises);

      this.logger.log(`Deleted ${snapshot.docs.length} media items for post ${postId}`);
    } catch (error) {
      this.logger.error(`Failed to delete media for post ${postId}`, error);
      throw error;
    }
  }

  /**
   * Like a post
   */
  async likePost(postId: string, request: IRequest): Promise<BaseResponse<{ message: string; likesCount: number }>> {
    try {
      const { posts, postLikes } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Check if post exists
      const postRef = firestore.collection(posts).doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists || postDoc.data()?.isDeleted) {
        throw new NotFoundException('Post not found');
      }

      // Check if user already liked this post (using composite key)
      const likeId = `${request.user.id}_${postId}`;
      const likeRef = firestore.collection(postLikes).doc(likeId);
      const likeDoc = await likeRef.get();

      if (likeDoc.exists) {
        throw new BadRequestException('You already liked this post');
      }

      // Create like document
      await likeRef.set({
        userId: request.user.id,
        postId,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      // Increment like counter
      await postRef.update({
        likesCount: admin.firestore.FieldValue.increment(1),
      });

      // Get updated like count
      const updatedPost = await postRef.get();
      const likesCount = updatedPost.data()?.likesCount || 0;

      this.logger.log(`Post ${postId} liked by user ${request.user.id}`);

      return BaseResponse.of({
        message: 'Post liked successfully',
        likesCount,
      });
    } catch (error) {
      this.logger.error(`Failed to like post ${postId}`, error);
      throw error;
    }
  }

  /**
   * Unlike a post
   */
  async unlikePost(postId: string, request: IRequest): Promise<BaseResponse<{ message: string; likesCount: number }>> {
    try {
      const { posts, postLikes } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Check if post exists
      const postRef = firestore.collection(posts).doc(postId);
      const postDoc = await postRef.get();

      if (!postDoc.exists || postDoc.data()?.isDeleted) {
        throw new NotFoundException('Post not found');
      }

      // Check if like exists (using composite key)
      const likeId = `${request.user.id}_${postId}`;
      const likeRef = firestore.collection(postLikes).doc(likeId);
      const likeDoc = await likeRef.get();

      if (!likeDoc.exists) {
        throw new BadRequestException('You have not liked this post');
      }

      // Delete like document
      await likeRef.delete();

      // Decrement like counter
      await postRef.update({
        likesCount: admin.firestore.FieldValue.increment(-1),
      });

      // Get updated like count
      const updatedPost = await postRef.get();
      const likesCount = Math.max(0, updatedPost.data()?.likesCount || 0);

      this.logger.log(`Post ${postId} unliked by user ${request.user.id}`);

      return BaseResponse.of({
        message: 'Post unliked successfully',
        likesCount,
      });
    } catch (error) {
      this.logger.error(`Failed to unlike post ${postId}`, error);
      throw error;
    }
  }

  /**
   * Check if user has liked a post
   */
  async hasUserLikedPost(postId: string, userId: string): Promise<boolean> {
    try {
      const { postLikes } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      const likeId = `${userId}_${postId}`;
      const likeDoc = await firestore.collection(postLikes).doc(likeId).get();

      return likeDoc.exists;
    } catch (error) {
      this.logger.error(`Failed to check like status for post ${postId}`, error);
      return false;
    }
  }

  /**
   * Determine content type based on content and media
   */
  private determineContentType(content: string, mediaUrls?: string[]): 'text' | 'media' | 'mixed' {
    const hasContent = content && content.trim().length > 0;
    const hasMedia = mediaUrls && mediaUrls.length > 0;

    if (hasContent && hasMedia) return 'mixed';
    if (hasMedia) return 'media';
    return 'text';
  }

  /**
   * Detect media type from URL
   */
  private detectMediaType(url: string): 'image' | 'video' | 'gif' {
    const lowerUrl = url.toLowerCase();

    if (lowerUrl.endsWith('.gif')) return 'gif';
    if (lowerUrl.match(/\.(jpg|jpeg|png|webp|svg)$/)) return 'image';
    if (lowerUrl.match(/\.(mp4|webm|mov|avi)$/)) return 'video';

    return 'image'; // default
  }
}