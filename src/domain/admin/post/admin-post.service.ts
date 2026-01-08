import { Injectable } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AdminCreatePostDto } from './dto/admin-create-post.dto';
import { AdminPostDetailDto } from './dto/admin-post-detail.dto';
import { AdminPostDto } from './dto/admin-post.dto';
import { AdminUpdatePostDto } from './dto/admin-update-post.dto';
import { GetAdminPostsDto } from './dto/get-admin-posts.dto';
import { ReportedPostDto } from './dto/reported-post.dto';

@Injectable()
export class AdminPostService {
  constructor(private readonly prisma: PrismaService) {}

  async getAllPosts(
    filters: GetAdminPostsDto,
  ): Promise<PaginationResponse<AdminPostDto>> {
    const {
      offset,
      limit,
      page,
      search,
      isActive,
      authorId,
      communityId,
      sortBy,
      sortOrder,
    } = filters;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
    };

    // Add search filter
    if (search) {
      whereClause.content = { contains: search, mode: 'insensitive' };
    }

    // Add active status filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Add author filter
    if (authorId) {
      whereClause.authorId = authorId;
    }

    // Add community filter
    if (communityId) {
      whereClause.communityId = communityId;
    }

    // Build orderBy clause
    const orderByClause: Record<string, string> = {};
    const validSortFields = [
      'createdAt',
      'updatedAt',
      'likeCount',
      'commentCount',
      'viewCount',
    ];

    if (sortBy && validSortFields.includes(sortBy)) {
      orderByClause[sortBy] = sortOrder || 'desc';
    } else {
      orderByClause.createdAt = 'desc';
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        select: {
          id: true,
          content: true,
          mediaUrls: true,
          likeCount: true,
          commentCount: true,
          viewCount: true,
          isActive: true,
          authorId: true,
          author: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
          communityId: true,
          community: {
            select: {
              name: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: orderByClause,
        skip: offset,
        take: limit,
      }),
      this.prisma.post.count({ where: whereClause }),
    ]);

    const items = posts.map((post) => ({
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      isActive: post.isActive,
      authorId: post.authorId,
      authorName: post.author.username,
      authorAvatarUrl: post.author.avatarUrl,
      communityId: post.communityId,
      communityName: post.community.name,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(items, pageInfo);
  }

  async getPostById(id: string): Promise<AdminPostDetailDto> {
    const post = await this.prisma.post.findFirst({
      where: {
        id,
        isDeleted: false,
      },
      select: {
        id: true,
        content: true,
        mediaUrls: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        isActive: true,
        metadata: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        community: {
          select: {
            id: true,
            name: true,
            avatarUrl: true,
          },
        },
        reports: {
          where: {
            isDeleted: false,
          },
          select: {
            id: true,
            reason: true,
            reportedBy: true,
            reporter: {
              select: {
                username: true,
              },
            },
            createdAt: true,
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!post) {
      throw new CustomError(ErrorCode.POST_NOT_FOUND);
    }

    return {
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      isActive: post.isActive,
      metadata: post.metadata,
      author: post.author,
      community: post.community,
      reports: post.reports.map((report) => ({
        id: report.id,
        reason: report.reason,
        reportedBy: report.reportedBy,
        reporterName: report.reporter.username,
        createdAt: report.createdAt,
      })),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async createPost(createPostDto: AdminCreatePostDto): Promise<AdminPostDto> {
    const { content, mediaUrls, authorId, communityId, metadata } =
      createPostDto;

    // Verify author exists
    const author = await this.prisma.user.findFirst({
      where: { id: authorId, isDeleted: false },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
      },
    });

    if (!author) {
      throw new CustomError(ErrorCode.USER_NOT_FOUND);
    }

    // Verify community exists
    const community = await this.prisma.community.findFirst({
      where: { id: communityId, isDeleted: false },
      select: {
        id: true,
        name: true,
      },
    });

    if (!community) {
      throw new CustomError(ErrorCode.COMMUNITY_NOT_FOUND);
    }

    const post = await this.prisma.post.create({
      data: {
        content,
        mediaUrls,
        metadata,
        authorId,
        communityId,
      },
      select: {
        id: true,
        content: true,
        mediaUrls: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        isActive: true,
        authorId: true,
        communityId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      isActive: post.isActive,
      authorId: post.authorId,
      authorName: author.username,
      authorAvatarUrl: author.avatarUrl,
      communityId: post.communityId,
      communityName: community.name,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async updatePost(
    id: string,
    updatePostDto: AdminUpdatePostDto,
  ): Promise<AdminPostDto> {
    const existingPost = await this.prisma.post.findFirst({
      where: { id, isDeleted: false },
    });

    if (!existingPost) {
      throw new CustomError(ErrorCode.POST_NOT_FOUND);
    }

    const post = await this.prisma.post.update({
      where: { id },
      data: updatePostDto,
      select: {
        id: true,
        content: true,
        mediaUrls: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        isActive: true,
        authorId: true,
        author: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        communityId: true,
        community: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      viewCount: post.viewCount,
      isActive: post.isActive,
      authorId: post.authorId,
      authorName: post.author.username,
      authorAvatarUrl: post.author.avatarUrl,
      communityId: post.communityId,
      communityName: post.community.name,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async deletePost(id: string): Promise<void> {
    const post = await this.prisma.post.findFirst({
      where: { id, isDeleted: false },
    });

    if (!post) {
      throw new CustomError(ErrorCode.POST_NOT_FOUND);
    }

    await this.prisma.post.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });
  }

  async getReportedPosts(
    filters: GetAdminPostsDto,
  ): Promise<PaginationResponse<ReportedPostDto>> {
    const { offset, limit, page, search, isActive, sortBy, sortOrder } =
      filters;

    // Build where clause for posts with reports
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
      reports: {
        some: {
          isDeleted: false,
        },
      },
    };

    // Add search filter
    if (search) {
      whereClause.content = { contains: search, mode: 'insensitive' };
    }

    // Add active status filter
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }

    // Build orderBy clause
    const orderByClause: Record<string, string> = {};
    const validSortFields = ['createdAt', 'updatedAt'];

    if (sortBy && validSortFields.includes(sortBy)) {
      orderByClause[sortBy] = sortOrder || 'desc';
    } else {
      orderByClause.createdAt = 'desc';
    }

    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        select: {
          id: true,
          content: true,
          mediaUrls: true,
          isActive: true,
          authorId: true,
          author: {
            select: {
              username: true,
              avatarUrl: true,
            },
          },
          communityId: true,
          community: {
            select: {
              name: true,
            },
          },
          reports: {
            where: {
              isDeleted: false,
            },
            select: {
              id: true,
              reason: true,
              reportedBy: true,
              reporter: {
                select: {
                  username: true,
                },
              },
              createdAt: true,
            },
            orderBy: {
              createdAt: 'desc',
            },
          },
          createdAt: true,
          updatedAt: true,
        },
        orderBy: orderByClause,
        skip: offset,
        take: limit,
      }),
      this.prisma.post.count({ where: whereClause }),
    ]);

    const items = posts.map((post) => ({
      id: post.id,
      content: post.content,
      mediaUrls: post.mediaUrls,
      reportCount: post.reports.length,
      isActive: post.isActive,
      authorId: post.authorId,
      authorName: post.author.username,
      authorAvatarUrl: post.author.avatarUrl,
      communityId: post.communityId,
      communityName: post.community.name,
      reports: post.reports.map((report) => ({
        id: report.id,
        reason: report.reason,
        reportedBy: report.reportedBy,
        reporterName: report.reporter.username,
        createdAt: report.createdAt,
      })),
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    }));

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(items, pageInfo);
  }

  async banPost(id: string): Promise<AdminPostDto> {
    const post = await this.prisma.post.findFirst({
      where: { id, isDeleted: false },
    });

    if (!post) {
      throw new CustomError(ErrorCode.POST_NOT_FOUND);
    }

    const updatedPost = await this.prisma.post.update({
      where: { id },
      data: {
        isActive: false,
      },
      select: {
        id: true,
        content: true,
        mediaUrls: true,
        likeCount: true,
        commentCount: true,
        viewCount: true,
        isActive: true,
        authorId: true,
        author: {
          select: {
            username: true,
            avatarUrl: true,
          },
        },
        communityId: true,
        community: {
          select: {
            name: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    return {
      id: updatedPost.id,
      content: updatedPost.content,
      mediaUrls: updatedPost.mediaUrls,
      likeCount: updatedPost.likeCount,
      commentCount: updatedPost.commentCount,
      viewCount: updatedPost.viewCount,
      isActive: updatedPost.isActive,
      authorId: updatedPost.authorId,
      authorName: updatedPost.author.username,
      authorAvatarUrl: updatedPost.author.avatarUrl,
      communityId: updatedPost.communityId,
      communityName: updatedPost.community.name,
      createdAt: updatedPost.createdAt,
      updatedAt: updatedPost.updatedAt,
    };
  }
}
