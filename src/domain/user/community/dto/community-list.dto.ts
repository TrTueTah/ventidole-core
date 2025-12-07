import { ApiProperty } from '@nestjs/swagger';
import { CommunityDto } from './community.dto';

export class CommunityListDto extends CommunityDto {
  @ApiProperty({
    example: 150,
    description: 'Total number of members in the community',
  })
  totalMember: number;

  @ApiProperty({
    example: false,
    description: 'Indicates if the community is new',
  })
  isNew: boolean;
}
