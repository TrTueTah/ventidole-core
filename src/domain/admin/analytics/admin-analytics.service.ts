import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/service/prisma/prisma.service';
import { AnalyticsFilterDto, TimeRange } from './dto/analytics-filter.dto';
import { EcommerceAnalyticsDto } from './dto/ecommerce-analytics.dto';
import { MetricDto } from './dto/metric.dto';
import { SocialAnalyticsDto } from './dto/social-analytics.dto';
import { TimeSeriesDataDto } from './dto/time-series-data.dto';

@Injectable()
export class AdminAnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get ecommerce analytics data
   */
  async getEcommerceAnalytics(
    filters: AnalyticsFilterDto,
  ): Promise<EcommerceAnalyticsDto> {
    const { startDate, endDate } = this.getDateRange(filters);
    const { startDate: prevStartDate, endDate: prevEndDate } =
      this.getPreviousPeriod(startDate, endDate);
    const timeRange = filters.timeRange || TimeRange.DAILY;

    // Fetch current period data
    const [
      totalRevenue,
      totalOrders,
      totalCustomers,
      prevTotalRevenue,
      prevTotalOrders,
      prevTotalCustomers,
      salesTimeSeries,
      topProducts,
      topCategories,
    ] = await Promise.all([
      this.getTotalRevenue(startDate, endDate),
      this.getTotalOrders(startDate, endDate),
      this.getTotalCustomers(startDate, endDate),
      this.getTotalRevenue(prevStartDate, prevEndDate),
      this.getTotalOrders(prevStartDate, prevEndDate),
      this.getTotalCustomers(prevStartDate, prevEndDate),
      this.getTimeSeriesSales(startDate, endDate, timeRange),
      this.getTopProducts(startDate, endDate, 10),
      this.getTopCategories(startDate, endDate, 10),
    ]);

    // Calculate metrics with percentage changes
    const metrics: MetricDto[] = [
      this.calculateMetric(
        'Total Revenue',
        totalRevenue,
        prevTotalRevenue,
      ),
      this.calculateMetric(
        'Total Orders',
        totalOrders,
        prevTotalOrders,
      ),
      this.calculateMetric(
        'Total Customers',
        totalCustomers,
        prevTotalCustomers,
      ),
      this.calculateMetric(
        'Average Order Value',
        totalOrders > 0 ? totalRevenue / totalOrders : 0,
        prevTotalOrders > 0 ? prevTotalRevenue / prevTotalOrders : 0,
      ),
    ];

    // Format chart data
    const charts: TimeSeriesDataDto[] = [
      {
        title: 'Sales Over Time',
        data: salesTimeSeries,
      },
    ];

    return {
      metrics,
      charts,
      tables: {
        topProducts,
        topCategories,
      },
    };
  }

  /**
   * Get social analytics data
   */
  async getSocialAnalytics(
    filters: AnalyticsFilterDto,
  ): Promise<SocialAnalyticsDto> {
    const { startDate, endDate } = this.getDateRange(filters);
    const { startDate: prevStartDate, endDate: prevEndDate } =
      this.getPreviousPeriod(startDate, endDate);
    const timeRange = filters.timeRange || TimeRange.DAILY;

    // Fetch current period data
    const [
      totalPosts,
      totalEngagement,
      activeCommunities,
      newMembers,
      prevTotalPosts,
      prevTotalEngagement,
      prevActiveCommunities,
      prevNewMembers,
      postsTimeSeries,
      topPosts,
      topCommunities,
    ] = await Promise.all([
      this.getTotalPosts(startDate, endDate),
      this.getTotalEngagement(startDate, endDate),
      this.getActiveCommunities(startDate, endDate),
      this.getNewMembers(startDate, endDate),
      this.getTotalPosts(prevStartDate, prevEndDate),
      this.getTotalEngagement(prevStartDate, prevEndDate),
      this.getActiveCommunities(prevStartDate, prevEndDate),
      this.getNewMembers(prevStartDate, prevEndDate),
      this.getTimeSeriesPosts(startDate, endDate, timeRange),
      this.getTopPosts(startDate, endDate, 10),
      this.getTopCommunities(startDate, endDate, 10),
    ]);

    // Calculate metrics with percentage changes
    const metrics: MetricDto[] = [
      this.calculateMetric('Total Posts', totalPosts, prevTotalPosts),
      this.calculateMetric(
        'Total Engagement',
        totalEngagement,
        prevTotalEngagement,
      ),
      this.calculateMetric(
        'Active Communities',
        activeCommunities,
        prevActiveCommunities,
      ),
      this.calculateMetric('New Members', newMembers, prevNewMembers),
    ];

    // Format chart data
    const charts: TimeSeriesDataDto[] = [
      {
        title: 'Posts Over Time',
        data: postsTimeSeries,
      },
    ];

    return {
      metrics,
      charts,
      tables: {
        topPosts,
        topCommunities,
      },
    };
  }

  /**
   * Helper: Calculate date range from filters
   */
  private getDateRange(filters: AnalyticsFilterDto): {
    startDate: Date;
    endDate: Date;
  } {
    const now = new Date();

    // Default to last 30 days if no dates provided
    const startDate = filters.startDate
      ? new Date(filters.startDate)
      : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const endDate = filters.endDate ? new Date(filters.endDate) : new Date();

    return { startDate, endDate };
  }

  /**
   * Helper: Get previous period for comparison
   */
  private getPreviousPeriod(
    startDate: Date,
    endDate: Date,
  ): { startDate: Date; endDate: Date } {
    const duration = endDate.getTime() - startDate.getTime();
    const prevEndDate = new Date(startDate.getTime() - 1);
    const prevStartDate = new Date(prevEndDate.getTime() - duration);

    return { startDate: prevStartDate, endDate: prevEndDate };
  }

  /**
   * Helper: Calculate metric with percentage change
   */
  private calculateMetric(
    label: string,
    currentValue: number,
    previousValue: number,
  ): MetricDto {
    const percentageChange =
      previousValue > 0
        ? ((currentValue - previousValue) / previousValue) * 100
        : 0;

    let trend: 'increase' | 'decrease' | 'stable' = 'stable';
    if (percentageChange > 0.1) trend = 'increase';
    else if (percentageChange < -0.1) trend = 'decrease';

    return {
      label,
      value: Math.round(currentValue * 100) / 100,
      percentageChange: Math.round(percentageChange * 100) / 100,
      trend,
      previousValue: Math.round(previousValue * 100) / 100,
    };
  }

  /**
   * Helper: Format date period based on timeRange
   */
  private formatPeriod(date: Date, timeRange: TimeRange): string {
    switch (timeRange) {
      case TimeRange.DAILY:
        return date.toISOString().substring(0, 10); // YYYY-MM-DD
      case TimeRange.WEEKLY:
        // Get ISO week number
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(
          ((date.getTime() - startOfYear.getTime()) / 86400000 + startOfYear.getDay() + 1) / 7,
        );
        return `${date.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
      case TimeRange.MONTHLY:
        return date.toISOString().substring(0, 7); // YYYY-MM
      case TimeRange.YEARLY:
        return date.getFullYear().toString(); // YYYY
      default:
        return date.toISOString().substring(0, 10);
    }
  }

  /**
   * Helper: Group time series data by timeRange
   */
  private groupByTimeRange<T extends { createdAt: Date }>(
    items: T[],
    timeRange: TimeRange,
    valueExtractor: (item: T) => number,
  ): any[] {
    const groupedData = items.reduce((acc, item) => {
      const period = this.formatPeriod(item.createdAt, timeRange);
      if (!acc[period]) {
        acc[period] = 0;
      }
      acc[period] += valueExtractor(item);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(groupedData)
      .map(([period, value]) => ({
        period,
        value: Math.round(value * 100) / 100,
      }))
      .sort((a, b) => a.period.localeCompare(b.period));
  }

  // ==================== ECOMMERCE QUERIES ====================

  private async getTotalRevenue(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
      _sum: {
        totalAmount: true,
      },
    });

    return result._sum.totalAmount || 0;
  }

  private async getTotalOrders(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.prisma.order.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
    });
  }

  private async getTotalCustomers(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const result = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
      select: {
        userId: true,
      },
      distinct: ['userId'],
    });

    return result.length;
  }

  private async getTimeSeriesSales(
    startDate: Date,
    endDate: Date,
    timeRange: TimeRange,
  ): Promise<any[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
      select: {
        createdAt: true,
        totalAmount: true,
      },
    });

    return this.groupByTimeRange(orders, timeRange, (order) => order.totalAmount);
  }

  private async getTopProducts(
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<any[]> {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          isActive: true,
        },
      },
      include: {
        product: true,
      },
    });

    const productStats = orderItems.reduce((acc, item) => {
      const productId = item.product.id;
      const productName = item.product.name;

      if (!acc[productId]) {
        acc[productId] = {
          id: productId,
          name: productName,
          revenue: 0,
          orders: 0,
        };
      }

      acc[productId].revenue += item.price * item.quantity;
      acc[productId].orders += 1;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(productStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  private async getTopCategories(
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<any[]> {
    const orderItems = await this.prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          isActive: true,
        },
      },
      include: {
        product: {
          include: {
            type: true,
          },
        },
      },
    });

    const categoryStats = orderItems.reduce((acc, item) => {
      // Skip items without a product type
      if (!item.product.type) {
        return acc;
      }

      const categoryId = item.product.type.id;
      const categoryName = item.product.type.name;

      if (!acc[categoryId]) {
        acc[categoryId] = {
          id: categoryId,
          name: categoryName,
          revenue: 0,
          orders: 0,
        };
      }

      acc[categoryId].revenue += item.price * item.quantity;
      acc[categoryId].orders += 1;

      return acc;
    }, {} as Record<string, any>);

    return Object.values(categoryStats)
      .sort((a: any, b: any) => b.revenue - a.revenue)
      .slice(0, limit);
  }

  // ==================== SOCIAL QUERIES ====================

  private async getTotalPosts(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.prisma.post.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
    });
  }

  private async getTotalEngagement(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const [likes, comments, views] = await Promise.all([
      this.prisma.postLike.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          post: {
            isActive: true,
          },
        },
      }),
      this.prisma.comment.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          post: {
            isActive: true,
          },
        },
      }),
      this.prisma.postView.count({
        where: {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
          post: {
            isActive: true,
          },
        },
      }),
    ]);

    return likes + comments + views;
  }

  private async getActiveCommunities(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    const posts = await this.prisma.post.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
      select: {
        communityId: true,
      },
    });

    // Count unique community IDs (excluding null)
    const uniqueCommunities = new Set(
      posts
        .map((post) => post.communityId)
        .filter((id) => id !== null),
    );

    return uniqueCommunities.size;
  }

  private async getNewMembers(
    startDate: Date,
    endDate: Date,
  ): Promise<number> {
    return this.prisma.communityFollower.count({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });
  }

  private async getTimeSeriesPosts(
    startDate: Date,
    endDate: Date,
    timeRange: TimeRange,
  ): Promise<any[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
      select: {
        createdAt: true,
      },
    });

    return this.groupByTimeRange(posts, timeRange, () => 1);
  }

  private async getTopPosts(
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<any[]> {
    const posts = await this.prisma.post.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
        isActive: true,
      },
      include: {
        _count: {
          select: {
            likes: true,
            comments: true,
            views: true,
          },
        },
      },
      orderBy: {
        likes: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return posts.map((post) => ({
      id: post.id,
      title: post.content.substring(0, 100),
      likes: post._count.likes,
      comments: post._count.comments,
      views: post._count.views,
      engagement: post._count.likes + post._count.comments + post._count.views,
    }));
  }

  private async getTopCommunities(
    startDate: Date,
    endDate: Date,
    limit: number,
  ): Promise<any[]> {
    const communities = await this.prisma.community.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            followers: true,
            posts: {
              where: {
                createdAt: {
                  gte: startDate,
                  lte: endDate,
                },
                isActive: true,
              },
            },
          },
        },
      },
      orderBy: {
        followers: {
          _count: 'desc',
        },
      },
      take: limit,
    });

    return communities.map((community) => ({
      id: community.id,
      name: community.name,
      members: community._count.followers,
      posts: community._count.posts,
    }));
  }
}
