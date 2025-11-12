import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { FirebaseService } from '@shared/service/firebase/firebase.service';
import { CreateReplyRequest } from './request/create-reply.request';
import { UpdateReplyRequest } from './request/update-reply.request';
import { GetRepliesRequest } from './request/get-replies.request';
import { CreateReplyResponse } from './response/create-reply.response';
import { UpdateReplyResponse } from './response/update-reply.response';
import { DeleteReplyResponse } from './response/delete-reply.response';
import { GetReplyResponse, ReplyDto, UserInfoDto } from './response/get-reply.response';
import { PageInfo, PaginationResponse } from '@shared/dto/pagination-response.dto';
import { BaseResponse } from '@shared/helper/response';
import * as admin from 'firebase-admin';
import { IRequest } from '@shared/interface/request.interface';
import { getCollection } from '@shared/helper/get-collection';

@Injectable()
export class ReplyService {
  private readonly logger = new Logger(ReplyService.name);

  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
  ) {}

  /**
   * Create a reply to a comment
   * 
   * Architecture (Firestore only for real-time):
   * 1. Verify user exists in PostgreSQL (source of truth)
   * 2. Verify comment exists in Firestore
   * 3. Create reply in Firestore with ONLY userId (no denormalized data)
   * 4. Update comment's repliesCount
   * 5. Return complete reply data with user info
   */
  async createReply(body: CreateReplyRequest, request: IRequest): Promise<BaseResponse<CreateReplyResponse>> {
    try {
      const { comments, replies } = getCollection();
      
      // 1. Verify user exists (source of truth check)
      const userExists = await this.prisma.user.findUnique({
        where: { id: request.user.id, isActive: true, isDeleted: false },
        select: { id: true },
      });

      if (!userExists) {
        throw new NotFoundException('User not found');
      }

      // 2. Verify comment exists
      const firestore = this.firebaseService.getFirestore();
      const commentDoc = await firestore.collection(comments).doc(body.commentId).get();
      
      if (!commentDoc.exists || commentDoc.data()?.isDeleted) {
        throw new NotFoundException('Comment not found');
      }

      // 3. Create reply in Firestore
      const replyRef = firestore.collection(replies).doc();
      const replyId = replyRef.id;
      const now = admin.firestore.FieldValue.serverTimestamp();

      const replyData = {
        userId: request.user.id,
        commentId: body.commentId,
        content: body.content,
        likesCount: 0,
        createdAt: now,
        updatedAt: now,
        isDeleted: false,
      };

      await replyRef.set(replyData);

      // 4. Update comment's repliesCount
      await firestore.collection(comments).doc(body.commentId).update({
        repliesCount: admin.firestore.FieldValue.increment(1),
        updatedAt: now,
      });

      this.logger.log(`Reply created: ${replyId} on comment ${body.commentId} by user ${request.user.id}`);

      // 5. Fetch fresh user info and return complete response
      const userInfo = await this.getUserInfo(request.user.id);

      const response: CreateReplyResponse = {
        replyId,
        commentId: body.commentId,
        content: body.content,
        user: userInfo,
        likesCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        isDeleted: false,
        message: 'Reply created successfully',
      };

      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error('Failed to create reply', error);
      throw error;
    }
  }

  /**
   * Get replies for a comment
   */
  async getReplies(
    commentId: string,
    query: GetRepliesRequest,
    request: IRequest,
  ): Promise<PaginationResponse<ReplyDto>> {
    try {
      const { comments, replies } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Verify comment exists
      const commentDoc = await firestore.collection(comments).doc(commentId).get();
      if (!commentDoc.exists || commentDoc.data()?.isDeleted) {
        throw new NotFoundException('Comment not found');
      }

      // Build query for replies on this comment
      let firestoreQuery: admin.firestore.Query = firestore.collection(replies);
      
      firestoreQuery = firestoreQuery.where('commentId', '==', commentId);
      firestoreQuery = firestoreQuery.where('isDeleted', '==', false);

      // Sort
      const sortField = query.sortBy || 'createdAt';
      const sortDirection = query.sortOrder || 'asc'; // Replies usually shown oldest first
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
      const repliesData: ReplyDto[] = await Promise.all(
        snapshot.docs.map((doc) => this.mapReplyToDto(doc.id, doc.data()))
      );

      return PaginationResponse.of(
        new PaginationResponse(repliesData, new PageInfo(query.page, query.limit, total))
      );
    } catch (error) {
      this.logger.error(`Failed to get replies for comment ${commentId}`, error);
      throw error;
    }
  }

  /**
   * Get a single reply by ID
   */
  async getReply(replyId: string, request: IRequest): Promise<BaseResponse<GetReplyResponse>> {
    try {
      const { replies } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      const replyDoc = await firestore.collection(replies).doc(replyId).get();

      if (!replyDoc.exists) {
        throw new NotFoundException('Reply not found');
      }

      const replyData = replyDoc.data();

      if (!replyData || replyData.isDeleted) {
        throw new NotFoundException('Reply not found');
      }

      const response = await this.mapReplyToDto(replyId, replyData);
      return BaseResponse.of({ data: response });
    } catch (error) {
      this.logger.error(`Failed to get reply ${replyId}`, error);
      throw error;
    }
  }

  /**
   * Update a reply
   */
  async updateReply(
    replyId: string,
    body: UpdateReplyRequest,
    request: IRequest,
  ): Promise<BaseResponse<UpdateReplyResponse>> {
    try {
      const { replies } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Get reply to verify ownership
      const replyRef = firestore.collection(replies).doc(replyId);
      const replyDoc = await replyRef.get();

      if (!replyDoc.exists) {
        throw new NotFoundException('Reply not found');
      }

      const replyData = replyDoc.data();

      if (!replyData) {
        throw new NotFoundException('Reply not found');
      }

      // Check ownership
      if (replyData.userId !== request.user.id) {
        throw new ForbiddenException('You do not have permission to update this reply');
      }

      // Check if reply is deleted
      if (replyData.isDeleted) {
        throw new BadRequestException('Cannot update a deleted reply');
      }

      // Update in Firestore
      const now = admin.firestore.FieldValue.serverTimestamp();
      await replyRef.update({
        content: body.content,
        updatedAt: now,
      });

      this.logger.log(`Reply updated: ${replyId} by user ${request.user.id}`);

      // Fetch updated reply
      const updatedDoc = await replyRef.get();
      const response = await this.mapReplyToDto(replyId, updatedDoc.data());

      return BaseResponse.of({
        ...response,
        message: 'Reply updated successfully',
      });
    } catch (error) {
      this.logger.error(`Failed to update reply ${replyId}`, error);
      throw error;
    }
  }

  /**
   * Delete a reply (soft delete)
   */
  async deleteReply(replyId: string, request: IRequest): Promise<BaseResponse<DeleteReplyResponse>> {
    try {
      const { comments, replies } = getCollection();
      const firestore = this.firebaseService.getFirestore();

      // Get reply to verify ownership
      const replyRef = firestore.collection(replies).doc(replyId);
      const replyDoc = await replyRef.get();

      if (!replyDoc.exists) {
        throw new NotFoundException('Reply not found');
      }

      const replyData = replyDoc.data();

      if (!replyData) {
        throw new NotFoundException('Reply not found');
      }

      // Check ownership
      if (replyData.userId !== request.user.id) {
        throw new ForbiddenException('You do not have permission to delete this reply');
      }

      // Check if already deleted
      if (replyData.isDeleted) {
        throw new BadRequestException('Reply is already deleted');
      }

      const now = admin.firestore.FieldValue.serverTimestamp();

      // Soft delete reply
      await replyRef.update({
        isDeleted: true,
        updatedAt: now,
      });

      // Decrement comment's repliesCount
      await firestore.collection(comments).doc(replyData.commentId).update({
        repliesCount: admin.firestore.FieldValue.increment(-1),
        updatedAt: now,
      });

      this.logger.log(`Reply deleted: ${replyId} by user ${request.user.id}`);

      const response: DeleteReplyResponse = {
        message: 'Reply deleted successfully',
        replyId,
      };

      return BaseResponse.of(response);
    } catch (error) {
      this.logger.error(`Failed to delete reply ${replyId}`, error);
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
   * Map Firestore reply data to DTO with fresh user info from PostgreSQL
   */
  private async mapReplyToDto(replyId: string, data: any): Promise<ReplyDto> {
    // Fetch fresh user info from PostgreSQL (single source of truth)
    const userInfo = await this.getUserInfo(data.userId);

    return {
      replyId,
      commentId: data.commentId,
      content: data.content,
      user: userInfo,
      likesCount: data.likesCount || 0,
      createdAt: data.createdAt?.toDate() || new Date(),
      updatedAt: data.updatedAt?.toDate() || new Date(),
      isDeleted: data.isDeleted || false,
    };
  }
}
