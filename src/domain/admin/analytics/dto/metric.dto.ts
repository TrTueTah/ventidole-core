import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MetricDto {
  @ApiProperty({
    example: 'Customers',
    description: 'Metric label',
  })
  label: string;

  @ApiProperty({
    example: 3782,
    description: 'Current metric value',
  })
  value: number;

  @ApiPropertyOptional({
    example: 11.01,
    description: 'Percentage change compared to previous period',
  })
  percentageChange?: number;

  @ApiPropertyOptional({
    example: 'increase',
    description: 'Trend direction',
    enum: ['increase', 'decrease', 'stable'],
  })
  trend?: 'increase' | 'decrease' | 'stable';

  @ApiPropertyOptional({
    example: 3422,
    description: 'Previous period value for comparison',
  })
  previousValue?: number;
}
