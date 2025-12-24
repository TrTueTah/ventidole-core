import { ApiProperty } from '@nestjs/swagger';

export class RecommendationMetadata {
  @ApiProperty({ type: [String], required: false })
  tags?: string[];

  @ApiProperty({ required: false })
  communityId?: string;
}

export class RecommendationItem {
  @ApiProperty()
  post_id: string;

  @ApiProperty()
  score: number;

  @ApiProperty({ type: RecommendationMetadata, required: false })
  metadata?: RecommendationMetadata;
}

export class RecommendationPagination {
  @ApiProperty()
  total: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  offset: number;

  @ApiProperty()
  has_more: boolean;
}

export class RecommendationResponseDto {
  @ApiProperty()
  user_id: string;

  @ApiProperty({ type: [RecommendationItem] })
  recommendations: RecommendationItem[];

  @ApiProperty({ type: RecommendationPagination })
  pagination: RecommendationPagination;
}
