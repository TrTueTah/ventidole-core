import { Injectable } from '@nestjs/common';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { CommentDto } from './dto/comment.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  async getCommentsByPostId(
    postId: string,
    pagination: PaginationDto,
  ): Promise<PaginationResponse<CommentDto>> {
    const { offset, limit, page } = pagination;

    // Check if post exists
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!post) {
      throw new CustomError(ErrorCode.PostNotFound);
    }

    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: {
          postId,
          isDeleted: false,
          isActive: true,
        },
        select: {
          id: true,
          content: true,
          postId: true,
          userId: true,
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          parentId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.comment.count({
        where: {
          postId,
          isDeleted: false,
          isActive: true,
        },
      }),
    ]);

    const transformedComments = comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      userId: comment.userId,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl ?? undefined,
      },
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    }));

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(transformedComments, pageInfo);
  }

  async createComment(
    userId: string,
    postId: string,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    const { content, parentId } = createCommentDto;

    // Check if post exists
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false,
        isActive: true,
      },
    });

    if (!post) {
      throw new CustomError(ErrorCode.PostNotFound);
    }

    // If parentId is provided, check if parent comment exists and belongs to the same post
    if (parentId) {
      const parentComment = await this.prisma.comment.findFirst({
        where: {
          id: parentId,
          postId,
          isDeleted: false,
        },
      });

      if (!parentComment) {
        throw new CustomError(ErrorCode.CommentNotFound);
      }

      if (parentComment.postId !== postId) {
        throw new CustomError(ErrorCode.CommentNotBelongToPost);
      }
    }

    const comment = await this.prisma.comment.create({
      data: {
        content,
        postId,
        userId,
        parentId: parentId || null,
      },
      select: {
        id: true,
        content: true,
        postId: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Increment comment count on post
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        commentCount: {
          increment: 1,
        },
      },
    });

    return {
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      userId: comment.userId,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl ?? undefined,
      },
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  async updateComment(
    userId: string,
    postId: string,
    commentId: string,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDto> {
    const { content } = updateCommentDto;

    // Check if comment exists
    const existingComment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        isDeleted: false,
      },
    });

    if (!existingComment) {
      throw new CustomError(ErrorCode.CommentNotFound);
    }

    // Check if comment belongs to the post
    if (existingComment.postId !== postId) {
      throw new CustomError(ErrorCode.CommentNotBelongToPost);
    }

    // Check ownership
    if (existingComment.userId !== userId) {
      throw new CustomError(ErrorCode.CommentNotOwned);
    }

    const comment = await this.prisma.comment.update({
      where: { id: commentId },
      data: { content },
      select: {
        id: true,
        content: true,
        postId: true,
        userId: true,
        user: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        parentId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: comment.id,
      content: comment.content,
      postId: comment.postId,
      userId: comment.userId,
      user: {
        id: comment.user.id,
        username: comment.user.username,
        avatarUrl: comment.user.avatarUrl ?? undefined,
      },
      parentId: comment.parentId,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
    };
  }

  async deleteComment(
    userId: string,
    postId: string,
    commentId: string,
  ): Promise<void> {
    // Check if comment exists
    const existingComment = await this.prisma.comment.findFirst({
      where: {
        id: commentId,
        isDeleted: false,
      },
    });

    if (!existingComment) {
      throw new CustomError(ErrorCode.CommentNotFound);
    }

    // Check if comment belongs to the post
    if (existingComment.postId !== postId) {
      throw new CustomError(ErrorCode.CommentNotBelongToPost);
    }

    // Check ownership
    if (existingComment.userId !== userId) {
      throw new CustomError(ErrorCode.CommentNotOwned);
    }

    // Soft delete the comment
    await this.prisma.comment.update({
      where: { id: commentId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    // Decrement comment count on post
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        commentCount: {
          decrement: 1,
        },
      },
    });
  }
}
