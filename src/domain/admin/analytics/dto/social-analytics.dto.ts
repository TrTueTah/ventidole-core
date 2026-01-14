import { ApiProperty } from '@nestjs/swagger';
import { MetricDto } from './metric.dto';
import { TimeSeriesDataDto } from './time-series-data.dto';

export class SocialAnalyticsDto {
  @ApiProperty({
    type: [MetricDto],
    description: 'Summary metrics for social analytics',
    example: [
      {
        label: 'Total Posts',
        value: 1250,
        percentageChange: 8.5,
        trend: 'increase',
        previousValue: 1152,
      },
      {
        label: 'Total Engagement',
        value: 45678,
        percentageChange: 12.3,
        trend: 'increase',
        previousValue: 40680,
      },
      {
        label: 'Active Communities',
        value: 125,
        percentageChange: 3.5,
        trend: 'increase',
        previousValue: 121,
      },
      {
        label: 'New Members',
        value: 890,
        percentageChange: -2.1,
        trend: 'decrease',
        previousValue: 909,
      },
    ],
  })
  metrics: MetricDto[];

  @ApiProperty({
    type: [TimeSeriesDataDto],
    description: 'Time series data for charts',
  })
  charts: TimeSeriesDataDto[];

  @ApiProperty({
    example: {
      topPosts: [
        { title: 'Post A', likes: 500, comments: 150 },
        { title: 'Post B', likes: 450, comments: 120 },
      ],
      topCommunities: [
        { name: 'Community A', members: 5000, posts: 300 },
        { name: 'Community B', members: 3500, posts: 250 },
      ],
    },
    description: 'Additional table data for social analytics',
  })
  tables?: Record<string, any>;
}
