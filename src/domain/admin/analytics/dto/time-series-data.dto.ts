import { ApiProperty } from '@nestjs/swagger';

export class TimeSeriesDataPointDto {
  @ApiProperty({
    example: '2026-01',
    description: 'Time period label (e.g., month, day)',
  })
  period: string;

  @ApiProperty({
    example: 350,
    description: 'Value for this period',
  })
  value: number;
}

export class TimeSeriesDataDto {
  @ApiProperty({
    example: 'Monthly Sales',
    description: 'Chart title',
  })
  title: string;

  @ApiProperty({
    type: [TimeSeriesDataPointDto],
    description: 'Data points for the chart',
  })
  data: TimeSeriesDataPointDto[];
}
