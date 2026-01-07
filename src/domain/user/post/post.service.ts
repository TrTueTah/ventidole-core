import { Injectable, Logger } from '@nestjs/common';
import {
  PageInfo,
  PaginationResponse,
} from '@shared/dto/pagination-response.dto';
import { ErrorCode } from '@shared/enum/error-code.enum';
import { CustomError } from '@shared/helper/error';
import { GetStreamNotificationService } from '@shared/service/getstream-notification/getstream-notification.service';
import { KnockWorkflowService } from '@shared/service/knock-workflow/knock-workflow.service';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { RecommendationService } from '@shared/service/recommendation/recommendation.service';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostsDto } from './dto/get-posts.dto';
import { PostDetailDto } from './dto/post-detail.dto';
import { PostDto } from './dto/post.dto';
import { UpdatePostDto } from './dto/update-post.dto';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly knockWorkflowService: KnockWorkflowService,
    private readonly getStreamNotificationService: GetStreamNotificationService,
    private readonly recommendationService: RecommendationService,
  ) {}

  async getPosts(
    filters: GetPostsDto,
    userId?: string,
  ): Promise<PaginationResponse<PostDto>> {
    const { offset, limit, page, communityId, filter } = filters;

    // Build where clause
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
      isActive: true,
    };

    // Add community filter
    if (communityId) {
      whereClause.communityId = communityId;
    }

    // Add user role filter
    if (filter) {
      whereClause.author = {
        role: filter,
      };
    }

    const [rawPosts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        select: {
          id: true,
          content: true,
          mediaUrls: true,
          authorId: true,
          communityId: true,
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              views: true,
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
        where: whereClause,
      }),
    ]);

    // Get like status for each post if userId is provided
    let likedPostIds: Set<string> = new Set();
    if (userId && rawPosts.length > 0) {
      const likes = await this.prisma.postLike.findMany({
        where: {
          userId,
          postId: {
            in: rawPosts.map((post) => post.id),
          },
        },
        select: {
          postId: true,
        },
      });
      likedPostIds = new Set(likes.map((like) => like.postId));
    }

    // Transform mediaUrls from JSON to array and add isLiked status
    const posts = rawPosts.map((post) => {
      let mediaUrls: string[] | null = null;

      if (post.mediaUrls) {
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
        id: post.id,
        content: post.content,
        mediaUrls,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        viewCount: post._count.views,
        isLiked: likedPostIds.has(post.id),
        authorId: post.authorId,
        communityId: post.communityId,
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    });

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(posts, pageInfo);
  }

  async getPostById(postId: string, userId?: string): Promise<PostDetailDto> {
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
        authorId: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          },
        },
        createdAt: true,
        updatedAt: true,
        communityId: true,
      },
    });

    if (!post) {
      throw new CustomError(ErrorCode.PostNotFound);
    }

    // Check if user has liked this post
    let isLiked = false;
    if (userId) {
      const like = await this.prisma.postLike.findUnique({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });
      isLiked = !!like;
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
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      viewCount: post._count.views,
      isLiked,
      authorId: post.authorId,
      author: {
        id: post.author.id,
        username: post.author.username,
        avatarUrl: post.author.avatarUrl ?? undefined,
      },
      communityId: post.communityId,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
    };
  }

  async createPost(
    userId: string,
    createPostDto: CreatePostDto,
  ): Promise<PostDto> {
    const { content, mediaUrls, communityId } = createPostDto;

    const post = await this.prisma.post.create({
      data: {
        content,
        mediaUrls: mediaUrls ? mediaUrls : undefined,
        authorId: userId,
        communityId: communityId,
      },
      select: {
        id: true,
        content: true,
        mediaUrls: true,
        authorId: true,
        communityId: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
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

    // Notify community followers if post is in a community
    if (post.communityId) {
      try {
        const [community, followers] = await Promise.all([
          this.prisma.community.findUnique({
            where: { id: post.communityId },
            select: { name: true },
          }),
          this.prisma.communityFollower.findMany({
            where: {
              communityId: post.communityId,
              userId: { not: userId }, // Exclude the author
              isActive: true,
              isDeleted: false,
            },
            select: {
              userId: true,
              user: {
                select: {
                  id: true,
                  email: true,
                  username: true,
                  avatarUrl: true,
                },
              },
            },
          }),
        ]);

        if (community && followers.length > 0) {
          // Map followers to recipient objects with user data for Knock
          const recipients = followers.map((f) => ({
            id: f.userId,
            name: f.user.username,
            email: f.user.email,
            avatar: f.user.avatarUrl || undefined,
          }));

          // Extract first 150 characters as excerpt
          const postExcerpt = post.content
            ? post.content.substring(0, 150) +
              (post.content.length > 150 ? '...' : '')
            : undefined;

          // Send Knock notification
          await this.knockWorkflowService.notifyCommunityNewPost({
            members: recipients,
            communityId: post.communityId,
            communityName: community.name,
            postId: post.id,
            postTitle: postExcerpt || 'New post',
            author: {
              id: post.author.id,
              name: post.author.username,
              avatar: post.author.avatarUrl ?? undefined,
            },
          });

          // Send real-time event via GetStream notification channels
          await this.getStreamNotificationService.emitNewPostEvent({
            userIds: followers.map((f) => f.userId),
            postId: post.id,
            authorName: post.author.username,
            communityName: community.name,
            postPreview: postExcerpt || 'New post',
          });

          this.logger.log(
            `Notified ${followers.length} followers about new post ${post.id}`,
          );
        }
      } catch (error) {
        // Log error but don't fail post creation
        this.logger.warn(
          `Failed to send community post notifications for post ${post.id}: ${error.message}`,
        );
      }
    }

    return {
      id: post.id,
      content: post.content,
      mediaUrls: transformedMediaUrls,
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      viewCount: post._count.views,
      isLiked: false, // User just created the post, they haven't liked it yet
      authorId: post.authorId,
      author: {
        id: post.author.id,
        username: post.author.username,
        avatarUrl: post.author.avatarUrl ?? undefined,
      },
      communityId: post.communityId,
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
        authorId: true,
        communityId: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Check if user has liked this post
    const like = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
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
      likeCount: post._count.likes,
      commentCount: post._count.comments,
      viewCount: post._count.views,
      isLiked: !!like,
      authorId: post.authorId,
      communityId: post.communityId,
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

  async likePost(userId: string, postId: string): Promise<{ liked: boolean }> {
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

    // Check if user already liked the post
    const existingLike = await this.prisma.postLike.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    if (existingLike) {
      // Unlike: Delete the like
      await this.prisma.postLike.delete({
        where: {
          postId_userId: {
            postId,
            userId,
          },
        },
      });

      return { liked: false };
    } else {
      // Like: Create the like
      await this.prisma.postLike.create({
        data: {
          postId,
          userId,
        },
      });

      // Notify post author about the like (only if liker is not the author)
      if (userId !== post.authorId) {
        try {
          // Get liker info
          const liker = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          });

          if (liker) {
            // Send Knock notification
            await this.knockWorkflowService.notifyPostLiked({
              authorId: post.authorId,
              liker: {
                id: liker.id,
                name: liker.username,
                avatar: liker.avatarUrl,
              },
              postId: post.id,
              postContent: post.content || 'your post',
            });

            // Send real-time event via GetStream notification channel
            await this.getStreamNotificationService.emitPostLikedEvent({
              userId: post.authorId,
              likerName: liker.username,
              postId: post.id,
            });

            this.logger.log(
              `Notified user ${post.authorId} about like from ${userId}`,
            );
          }
        } catch (error) {
          this.logger.warn(
            `Failed to send post like notifications for post ${post.id}: ${error.message}`,
          );
          // Don't throw - notification failure shouldn't block like action
        }
      }

      return { liked: true };
    }
  }

  async viewPost(userId: string, postId: string): Promise<void> {
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

    // Check if user already viewed the post
    const existingView = await this.prisma.postView.findUnique({
      where: {
        postId_userId: {
          postId,
          userId,
        },
      },
    });

    // Only create view if it doesn't exist
    if (!existingView) {
      await this.prisma.postView.create({
        data: {
          postId,
          userId,
        },
      });
    }
    // If view already exists, do nothing (idempotent)
  }

  async getRecommendations(
    userId: string,
    limit: number = 20,
    offset: number = 0,
  ): Promise<PaginationResponse<PostDto>> {
    // Fetch recommendations from the recommendation service
    const recommendations =
      await this.recommendationService.getUserRecommendations(
        userId,
        limit,
        offset,
      );

    // Extract post IDs from recommendations
    const postIds = recommendations.recommendations.map((rec) => rec.post_id);

    if (postIds.length === 0) {
      // No recommendations found, return empty pagination
      const pageInfo = new PageInfo(
        Math.floor(offset / limit) + 1,
        limit,
        recommendations.pagination.total,
      );
      return new PaginationResponse([], pageInfo);
    }

    // Query database for the actual post data
    const rawPosts = await this.prisma.post.findMany({
      where: {
        id: {
          in: postIds,
        },
        isDeleted: false,
        isActive: true,
      },
      select: {
        id: true,
        content: true,
        mediaUrls: true,
        authorId: true,
        communityId: true,
        author: {
          select: {
            id: true,
            username: true,
            avatarUrl: true,
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Get like status for each post if userId is provided
    let likedPostIds: Set<string> = new Set();
    if (rawPosts.length > 0) {
      const likes = await this.prisma.postLike.findMany({
        where: {
          userId,
          postId: {
            in: rawPosts.map((post) => post.id),
          },
        },
        select: {
          postId: true,
        },
      });
      likedPostIds = new Set(likes.map((like) => like.postId));
    }

    // Create a map of posts by ID for efficient lookup
    const postMap = new Map(rawPosts.map((post) => [post.id, post]));

    // Order posts according to recommendation order and transform
    const posts = postIds
      .map((postId) => postMap.get(postId))
      .filter((post) => post !== undefined)
      .map((post) => {
        let mediaUrls: string[] | null = null;

        if (post.mediaUrls) {
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
          id: post.id,
          content: post.content,
          mediaUrls,
          likeCount: post._count.likes,
          commentCount: post._count.comments,
          viewCount: post._count.views,
          isLiked: likedPostIds.has(post.id),
          authorId: post.authorId,
          communityId: post.communityId,
          author: post.author,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
        };
      });

    const pageInfo = new PageInfo(
      Math.floor(offset / limit) + 1,
      limit,
      recommendations.pagination.total,
    );

    return new PaginationResponse(posts, pageInfo);
  }

  async getPostsByUserId(
    targetUserId: string,
    filters: GetPostsDto,
    currentUserId?: string,
  ): Promise<PaginationResponse<PostDto>> {
    const { offset, limit, page } = filters;

    // Build where clause to get posts by specific user
    const whereClause: Record<string, unknown> = {
      isDeleted: false,
      isActive: true,
      authorId: targetUserId,
    };

    const [rawPosts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: whereClause,
        select: {
          id: true,
          content: true,
          mediaUrls: true,
          authorId: true,
          communityId: true,
          author: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
            },
          },
          _count: {
            select: {
              likes: true,
              comments: true,
              views: true,
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
        where: whereClause,
      }),
    ]);

    // Get like status for each post if currentUserId is provided
    let likedPostIds: Set<string> = new Set();
    if (currentUserId && rawPosts.length > 0) {
      const likes = await this.prisma.postLike.findMany({
        where: {
          userId: currentUserId,
          postId: {
            in: rawPosts.map((post) => post.id),
          },
        },
        select: {
          postId: true,
        },
      });
      likedPostIds = new Set(likes.map((like) => like.postId));
    }

    // Transform mediaUrls from JSON to array and add isLiked status
    const posts = rawPosts.map((post) => {
      let mediaUrls: string[] | null = null;

      if (post.mediaUrls) {
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
        id: post.id,
        content: post.content,
        mediaUrls,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        viewCount: post._count.views,
        isLiked: likedPostIds.has(post.id),
        authorId: post.authorId,
        communityId: post.communityId,
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    });

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(posts, pageInfo);
  }

  async getReactionPostsByUserId(
    targetUserId: string,
    filters: GetPostsDto,
    currentUserId?: string,
  ): Promise<PaginationResponse<PostDto>> {
    const { offset, limit, page } = filters;

    // Get posts that the user has liked
    const [likedPosts, total] = await Promise.all([
      this.prisma.postLike.findMany({
        where: {
          userId: targetUserId,
          post: {
            isDeleted: false,
            isActive: true,
          },
        },
        select: {
          post: {
            select: {
              id: true,
              content: true,
              mediaUrls: true,
              authorId: true,
              communityId: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  avatarUrl: true,
                },
              },
              _count: {
                select: {
                  likes: true,
                  comments: true,
                  views: true,
                },
              },
              createdAt: true,
              updatedAt: true,
            },
          },
          createdAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip: offset,
        take: limit,
      }),
      this.prisma.postLike.count({
        where: {
          userId: targetUserId,
          post: {
            isDeleted: false,
            isActive: true,
          },
        },
      }),
    ]);

    const rawPosts = likedPosts.map((like) => like.post);

    // Get like status for each post if currentUserId is provided
    let likedPostIds: Set<string> = new Set();
    if (currentUserId && rawPosts.length > 0) {
      const likes = await this.prisma.postLike.findMany({
        where: {
          userId: currentUserId,
          postId: {
            in: rawPosts.map((post) => post.id),
          },
        },
        select: {
          postId: true,
        },
      });
      likedPostIds = new Set(likes.map((like) => like.postId));
    }

    // Transform mediaUrls from JSON to array and add isLiked status
    const posts = rawPosts.map((post) => {
      let mediaUrls: string[] | null = null;

      if (post.mediaUrls) {
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
        id: post.id,
        content: post.content,
        mediaUrls,
        likeCount: post._count.likes,
        commentCount: post._count.comments,
        viewCount: post._count.views,
        isLiked: likedPostIds.has(post.id),
        authorId: post.authorId,
        communityId: post.communityId,
        author: post.author,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt,
      };
    });

    const pageInfo = new PageInfo(page, limit, total);

    return new PaginationResponse(posts, pageInfo);
  }
}
