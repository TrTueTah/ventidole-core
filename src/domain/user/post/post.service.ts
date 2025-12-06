import { Injectable } from '@nestjs/common';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { PostDto } from './dto/post.dto';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { CustomError } from '@shared/helper/error';
import { ErrorCode } from '@shared/enum/error-code.enum';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  async getPosts(
    pagination: PaginationDto,
  ): Promise<PaginationResponse<PostDto>> {
    const { offset, limit, page } = pagination;

    const [rawPosts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: {
          isDeleted: false,
          isActive: true,
        },
        select: {
          id: true,
          content: true,
          mediaUrls: true,
          likeCount: true,
          commentCount: true,
          viewCount: true,
          authorId: true,
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.post.count({
        where: {
          isDeleted: false,
          isActive: true,
        },
      }),
    ]);

    // Transform mediaUrls from JSON to array
    const posts = rawPosts.map((post) => {
      let mediaUrls: string[] | null = null;

      if (post.mediaUrls) {
        console.log('Raw mediaUrls:', post.mediaUrls);

        if (Array.isArray(post.mediaUrls)) {
          mediaUrls = post.mediaUrls.every((item) => typeof item === 'string')
            ? (post.mediaUrls as string[])
            : null;
        } else if (typeof post.mediaUrls === 'string') {
          try {
            const parsed = JSON.parse(post.mediaUrls);
            mediaUrls = Array.isArray(parsed) ? parsed : null;
          } catch {
            mediaUrls = null;
          }
        } else if (typeof post.mediaUrls === 'object') {
          const values = Object.values(post.mediaUrls);
          mediaUrls = values.every((v) => typeof v === 'string')
            ? values
            : null;
        }
      }

      return {
        ...post,
        mediaUrls,
      };
    });

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(posts, pageInfo);
  }

  async getPostById(postId: string): Promise<PostDto> {
    const post = await this.prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        content: true,
        mediaUrls: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        authorId: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!post) {
      throw new CustomError(ErrorCode.PostNotFound);
    }

    // Transform mediaUrls from JSON to array
    let transformedMediaUrls: string[] | null = null;

    if (post.mediaUrls) {
      if (Array.isArray(post.mediaUrls)) {
        transformedMediaUrls = post.mediaUrls.every(
          (item) => typeof item === 'string',
        )
          ? (post.mediaUrls as string[])
          : null;
      } else if (typeof post.mediaUrls === 'string') {
        try {
          const parsed = JSON.parse(post.mediaUrls);
          transformedMediaUrls = Array.isArray(parsed) ? parsed : null;
        } catch {
          transformedMediaUrls = null;
        }
      } else if (typeof post.mediaUrls === 'object') {
        const values = Object.values(post.mediaUrls);
        transformedMediaUrls = values.every((v) => typeof v === 'string')
          ? values
          : null;
      }
    }

    return {
      id: post.id,
      content: post.content,
      mediaUrls: transformedMediaUrls,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        username: post.author.username,
        avatarUrl: post.author.avatarUrl ?? undefined,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async createPost(
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<PostDto> {
    const { content, mediaUrls } = createPostDto;

    const post = await this.prisma.post.create({
      data: {
        content,
        mediaUrls: mediaUrls ? mediaUrls : undefined,
        authorId: userId,
      },
      select: {
        id: true,
        content: true,
        mediaUrls: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        authorId: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform mediaUrls from JSON to array
    let transformedMediaUrls: string[] | null = null;

    if (post.mediaUrls) {
      if (Array.isArray(post.mediaUrls)) {
        transformedMediaUrls = post.mediaUrls.every(
          (item) => typeof item === 'string',
        )
          ? (post.mediaUrls as string[])
          : null;
      } else if (typeof post.mediaUrls === 'string') {
        try {
          const parsed = JSON.parse(post.mediaUrls);
          transformedMediaUrls = Array.isArray(parsed) ? parsed : null;
        } catch {
          transformedMediaUrls = null;
        }
      } else if (typeof post.mediaUrls === 'object') {
        const values = Object.values(post.mediaUrls);
        transformedMediaUrls = values.every((v) => typeof v === 'string')
          ? values
          : null;
      }
    }

    return {
      id: post.id,
      content: post.content,
      mediaUrls: transformedMediaUrls,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        username: post.author.username,
        avatarUrl: post.author.avatarUrl ?? undefined,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async updatePost(
    userId: string,
    postId: string,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDto> {
    // Check if post exists
    const existingPost = await this.prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false,
      },
    });

    if (!existingPost) {
      throw new CustomError(ErrorCode.PostNotFound);
    }

    // Check ownership
    if (existingPost.authorId !== userId) {
      throw new CustomError(ErrorCode.PostNotOwned);
    }

    const { content, mediaUrls } = updatePostDto;

    // Build update data object
    const updateData: {
      content?: string;
      mediaUrls?: string[];
    } = {};
    if (content !== undefined) {
      updateData.content = content;
    }
    if (mediaUrls !== undefined) {
      updateData.mediaUrls = mediaUrls.length > 0 ? mediaUrls : undefined;
    }

    const post = await this.prisma.post.update({
      where: { id: postId },
      data: updateData,
      select: {
        id: true,
        content: true,
        mediaUrls: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        authorId: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Transform mediaUrls from JSON to array
    let transformedMediaUrls: string[] | null = null;

    if (post.mediaUrls) {
      if (Array.isArray(post.mediaUrls)) {
        transformedMediaUrls = post.mediaUrls.every(
          (item) => typeof item === 'string',
        )
          ? (post.mediaUrls as string[])
          : null;
      } else if (typeof post.mediaUrls === 'string') {
        try {
          const parsed = JSON.parse(post.mediaUrls);
          transformedMediaUrls = Array.isArray(parsed) ? parsed : null;
        } catch {
          transformedMediaUrls = null;
        }
      } else if (typeof post.mediaUrls === 'object') {
        const values = Object.values(post.mediaUrls);
        transformedMediaUrls = values.every((v) => typeof v === 'string')
          ? values
          : null;
      }
    }

    return {
      id: post.id,
      content: post.content,
      mediaUrls: transformedMediaUrls,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        username: post.author.username,
        avatarUrl: post.author.avatarUrl ?? undefined,
      },
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async deletePost(userId: string, postId: string): Promise<void> {
    // Check if post exists
    const existingPost = await this.prisma.post.findFirst({
      where: {
        id: postId,
        isDeleted: false,
      },
    });

    if (!existingPost) {
      throw new CustomError(ErrorCode.PostNotFound);
    }

    // Check ownership
    if (existingPost.authorId !== userId) {
      throw new CustomError(ErrorCode.PostNotOwned);
    }

    // Soft delete the post
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }
}
