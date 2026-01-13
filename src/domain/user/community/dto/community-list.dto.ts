import { ApiProperty } from '@nestjs/swagger';
import { CommunityDto } from './community.dto';

export class CommunityListDto extends CommunityDto {
  @ApiProperty({
    example: 150,
    description: 'Total number of members (followers) in the community',
  })
  totalMember: number;

  @ApiProperty({
    example: 5,
    description: 'Total number of idols in the community',
  })
  totalIdol: number;

  @ApiProperty({
    example: false,
    description: 'Indicates if the community is new',
  })
  isNew: boolean;
}
