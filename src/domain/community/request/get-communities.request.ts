import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationDto } from '@shared/dto/pagination-request.dto';
import { IsOptional, IsEnum, IsString } from 'class-validator';

export enum CommunityFilterType {
  ALL = 'all', // All communities with isJoin field
  JOINED = 'joined', // Only communities user has joined
}

export class GetCommunitiesRequest extends PaginationDto {
  @ApiPropertyOptional({
    enum: CommunityFilterType,
    description: 'Filter communities by join status. "all" returns all communities with isJoin field, "joined" returns only joined communities',
    default: CommunityFilterType.JOINED,
  })
  @IsOptional()
  @IsEnum(CommunityFilterType)
  filter?: CommunityFilterType = CommunityFilterType.JOINED;

  @ApiPropertyOptional({
    type: String,
    description: 'Search communities by name (case-insensitive partial match)',
    example: 'K-pop',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
