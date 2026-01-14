import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional } from 'class-validator';

export enum TimeRange {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY',
}

export class AnalyticsFilterDto {
  @ApiPropertyOptional({
    example: '2026-01-01',
    description: 'Start date for analytics (ISO 8601 format)',
  })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({
    example: '2026-01-31',
    description: 'End date for analytics (ISO 8601 format)',
  })
  @IsDateString()
  @IsOptional()
  endDate?: string;

  @ApiPropertyOptional({
    example: TimeRange.MONTHLY,
    description: 'Time range granularity for grouping data (daily, weekly, monthly, yearly)',
    enum: TimeRange,
    default: TimeRange.DAILY,
  })
  @IsEnum(TimeRange)
  @IsOptional()
  timeRange?: TimeRange;
}
