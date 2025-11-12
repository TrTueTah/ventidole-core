import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { FirebaseService } from '@shared/service/firebase/firebase.service';
import { CreateCommentRequest } from './request/create-comment.request';
import { UpdateCommentRequest } from './request/update-comment.request';
import { GetCommentsRequest } from './request/get-comments.request';
import { CreateCommentResponse } from './response/create-comment.response';
import { UpdateCommentResponse } from './response/update-comment.response';
import { DeleteCommentResponse } from './response/delete-comment.response';
import { GetCommentResponse, CommentDto, UserInfoDto } from './response/get-comment.response';
import { PageInfo, PaginationResponse } from '@shared/dto/pagination-response.dto';
import { BaseResponse } from '@shared/helper/response';
import * as admin from 'firebase-admin';
import { IRequest } from '@shared/interface/request.interface';
import { getCollection } from '@shared/helper/get-collection';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
  ) {}

  /**
   * Create a new comment on a post
   * 
   * Architecture (Firestore only for real-time):
   * 1. Verify user exists in PostgreSQL (source of truth)
   * 2. Verify post exists in Firestore
   * 3. Create comment in Firestore with ONLY userId (no denormalized data)
   * 4. Update post's commentsCount
   * 5. Return complete comment data with user info
   */
  async createComment(body: CreateCommentRequest, request: IRequest): Promise<BaseResponse<CreateCommentResponse>> {
    try {
      const { comments, posts } = getCollection();
      
      // 1. Verify user exists (source of truth check)
      const userExists = await this.prisma.user.findUnique({
        where: { id: request.user.id, isActive: true, isDeleted: false },
        select: { id: true },
      });

      if (!userExists) {
        throw new NotFoundException('User not found');
      }

      // 2. Verify post exists
      const firestore = this.firebaseService.getFirestore();
      const postDoc = await firestore.collection(posts).doc(body.postId).get();
      
      if (!postDoc.exists || postDoc.data()?.isDeleted) {
        throw new NotFoundException('Post not found');
      }

      // 3. Create comment in Firestore
      const commentRef = firestore.collection(comments).doc();
      const commentId = commentRef.id;
      const now = admin.firestore.FieldValue.serverTimestamp();

      const commentData = {
        userId: request.user.id,
        postId: body.postId,
        content: body.content,
        likesCount: 0,
        repliesCount: 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };

      await commentRef.set(commentData);

      // 4. Update post's commentsCount
      await firestore.collection(posts).doc(body.postId).update({
        commentsCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });

      this.logger.log(`Comment created: ${commentId} on post ${body.postId} by user ${request.user.id}`);

      // 5. Fetch fresh user info and return complete response
      const userInfo = await this.getUserInfo(request.user.id);

      const response: CreateCommentResponse = {
        commentId,
        postId: body.postId,
        parentCommentId: undefined,
        content: body.content,
        user: userInfo,
        likesCount: 0,
        repliesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        message: 'Comment created successfully',
      };

      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error('Failed to create comment', error);
      throw error;
    }
  }

  /**
   * Get comments for a post
   */
  async getComments(
    postId: string,
    query: GetCommentsRequest,
    request: IRequest,
  ): Promise<PaginationResponse<CommentDto>> {
    try {
      const { comments, posts } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Verify post exists
      const postDoc = await firestore.collection(posts).doc(postId).get();
      if (!postDoc.exists || postDoc.data()?.isDeleted) {
        throw new NotFoundException('Post not found');
      }

      // Build query for comments on this post
      let firestoreQuery: admin.firestore.Query = firestore.collection(comments);
      
      firestoreQuery = firestoreQuery.where('postId', '==', postId);
      firestoreQuery = firestoreQuery.where('isDeleted', '==', false);

      // Sort
      const sortField = query.sortBy || 'createdAt';
      const sortDirection = query.sortOrder || 'desc';
      firestoreQuery = firestoreQuery.orderBy(sortField, sortDirection);

      // Get total count
      const countSnapshot = await firestoreQuery.count().get();
      const total = countSnapshot.data().count;

      // Apply pagination
      const offset = query.offset || 0;
      const limit = query.limit || 20;
      
      firestoreQuery = firestoreQuery.offset(offset).limit(limit);

      // Execute query
      const snapshot = await firestoreQuery.get();

      // Map results
      const commentsData: CommentDto[] = await Promise.all(
        snapshot.docs.map((doc) => this.mapCommentToDto(doc.id, doc.data()))
      );

      return PaginationResponse.of(
        new PaginationResponse(commentsData, new PageInfo(query.page, query.limit, total))
      );
    } catch (error) {
      this.logger.error(`Failed to get comments for post ${postId}`, error);
      throw error;
    }
  }

  /**
   * Get a single comment by ID
   */
  async getComment(commentId: string, request: IRequest): Promise<BaseResponse<GetCommentResponse>> {
    try {
      const { comments } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      const commentDoc = await firestore.collection(comments).doc(commentId).get();

      if (!commentDoc.exists) {
        throw new NotFoundException('Comment not found');
      }

      const commentData = commentDoc.data();

      if (!commentData || commentData.isDeleted) {
        throw new NotFoundException('Comment not found');
      }

      const response = await this.mapCommentToDto(commentId, commentData);
      return BaseResponse.of({ data: response });
    } catch (error) {
      this.logger.error(`Failed to get comment ${commentId}`, error);
      throw error;
    }
  }

  /**
   * Update a comment
   */
  async updateComment(
    commentId: string,
    body: UpdateCommentRequest,
    request: IRequest,
  ): Promise<BaseResponse<UpdateCommentResponse>> {
    try {
      const { comments } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Get comment to verify ownership
      const commentRef = firestore.collection(comments).doc(commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        throw new NotFoundException('Comment not found');
      }

      const commentData = commentDoc.data();

      if (!commentData) {
        throw new NotFoundException('Comment not found');
      }

      // Check ownership
      if (commentData.userId !== request.user.id) {
        throw new ForbiddenException('You do not have permission to update this comment');
      }

      // Check if comment is deleted
      if (commentData.isDeleted) {
        throw new BadRequestException('Cannot update a deleted comment');
      }

      // Update in Firestore
      const now = admin.firestore.FieldValue.serverTimestamp();
      await commentRef.update({
        content: body.content,
        updatedAt: now,
      });

      this.logger.log(`Comment updated: ${commentId} by user ${request.user.id}`);

      // Fetch updated comment
      const updatedDoc = await commentRef.get();
      const response = await this.mapCommentToDto(commentId, updatedDoc.data());

      return BaseResponse.of({
        ...response,
        message: 'Comment updated successfully',
      });
    } catch (error) {
      this.logger.error(`Failed to update comment ${commentId}`, error);
      throw error;
    }
  }

  /**
   * Delete a comment (soft delete)
   */
  async deleteComment(commentId: string, request: IRequest): Promise<BaseResponse<DeleteCommentResponse>> {
    try {
      const { comments, posts } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Get comment to verify ownership
      const commentRef = firestore.collection(comments).doc(commentId);
      const commentDoc = await commentRef.get();

      if (!commentDoc.exists) {
        throw new NotFoundException('Comment not found');
      }

      const commentData = commentDoc.data();

      if (!commentData) {
        throw new NotFoundException('Comment not found');
      }

      // Check ownership
      if (commentData.userId !== request.user.id) {
        throw new ForbiddenException('You do not have permission to delete this comment');
      }

      // Check if already deleted
      if (commentData.isDeleted) {
        throw new BadRequestException('Comment is already deleted');
      }

      const now = admin.firestore.FieldValue.serverTimestamp();

      // Soft delete comment
      await commentRef.update({
        isDeleted: true,
        updatedAt: now,
      });

      // Decrement post's commentsCount
      await firestore.collection(posts).doc(commentData.postId).update({
        commentsCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: now,
      });

      this.logger.log(`Comment deleted: ${commentId} by user ${request.user.id}`);

      const response: DeleteCommentResponse = {
        message: 'Comment deleted successfully',
        commentId,
      };

      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error(`Failed to delete comment ${commentId}`, error);
      throw error;
    }
  }

  /**
   * Get user info from PostgreSQL (single source of truth)
   */
  private async getUserInfo(userId: string): Promise<UserInfoDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fan: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
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
        userId,
        username: 'unknown',
        displayName: 'Unknown User',
        avatarUrl: undefined,
      };
    }

    const username = user.fan?.username || user.idol?.stageName || 'unknown';
    const displayName = user.fan?.username || user.idol?.stageName || 'Unknown User';
    const avatarUrl = user.fan?.avatarUrl || user.idol?.avatarUrl || undefined;

    return {
      userId,
      username,
      displayName,
      avatarUrl,
    };
  }

  /**
   * Map Firestore comment data to DTO with fresh user info from PostgreSQL
   */
  private async mapCommentToDto(commentId: string, data: any): Promise<CommentDto> {
    // Fetch fresh user info from PostgreSQL (single source of truth)
    const userInfo = await this.getUserInfo(data.userId);

    return {
      commentId,
      postId: data.postId,
      parentCommentId: undefined,
      content: data.content,
      user: userInfo,
      likesCount: data.likesCount || 0,
      repliesCount: data.repliesCount || 0,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      isDeleted: data.isDeleted || false,
    };
  }
}
