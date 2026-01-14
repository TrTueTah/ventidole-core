import { ApiProperty } from '@nestjs/swagger';
import { MetricDto } from './metric.dto';
import { TimeSeriesDataDto } from './time-series-data.dto';

export class EcommerceAnalyticsDto {
  @ApiProperty({
    type: [MetricDto],
    description: 'Summary metrics for ecommerce',
    example: [
      {
        label: 'Total Revenue',
        value: 125000,
        percentageChange: 15.5,
        trend: 'increase',
        previousValue: 108000,
      },
      {
        label: 'Total Orders',
        value: 5359,
        percentageChange: -9.05,
        trend: 'decrease',
        previousValue: 5890,
      },
      {
        label: 'Total Customers',
        value: 3782,
        percentageChange: 11.01,
        trend: 'increase',
        previousValue: 3406,
      },
      {
        label: 'Average Order Value',
        value: 23.32,
        percentageChange: 5.2,
        trend: 'increase',
        previousValue: 22.16,
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
      topProducts: [
        { name: 'Product A', revenue: 25000, orders: 150 },
        { name: 'Product B', revenue: 18000, orders: 120 },
      ],
      topCategories: [
        { name: 'Electronics', revenue: 50000, orders: 300 },
        { name: 'Clothing', revenue: 35000, orders: 250 },
      ],
    },
    description: 'Additional table data for ecommerce analytics',
  })
  tables?: Record<string, any>;
}
