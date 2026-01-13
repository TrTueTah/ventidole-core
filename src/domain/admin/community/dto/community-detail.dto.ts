import { ApiProperty } from '@nestjs/swagger';
import { CommunityDto } from './community.dto';

export class AdminCommunityDetailDto extends CommunityDto {
  @ApiProperty({
    example: 100,
    description: 'Total members (followers) in the community',
  })
  totalMembers: number;

  @ApiProperty({
    example: 5,
    description: 'Total idols in the community',
  })
  totalIdols: number;

  @ApiProperty({
    example: 50,
    description: 'Total posts in the community',
  })
  totalPosts: number;
}
