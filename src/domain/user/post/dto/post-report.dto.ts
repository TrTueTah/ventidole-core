import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PostReportDto {
  @ApiProperty({
    description: 'Unique identifier of the report',
    example: 'clx1234567890abcdefgh',
  })
  id: string;

  @ApiProperty({
    description: 'ID of the reported post',
    example: 'clx0987654321zyxwvuts',
  })
  postId: string;

  @ApiProperty({
    description: 'ID of the user who reported the post',
    example: 'clx1111222233334444',
  })
  reportedBy: string;

  @ApiPropertyOptional({
    description: 'Reason for reporting the post',
    example: 'This post contains inappropriate content',
  })
  reason?: string;

  @ApiProperty({
    description: 'Timestamp when the report was created',
    example: '2024-01-07T10:30:00Z',
  })
  createdAt: Date;
}
