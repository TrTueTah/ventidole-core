import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChatChannelDto } from '../../dto/chat-channel.dto';
import { CommunityDto } from './community.dto';

export class IdolDto {
  @ApiProperty({ example: 'clxxxxxxx', description: 'Idol ID' })
  id: string;

  @ApiProperty({
    example: 'john_idol',
    description: 'Idol username',
  })
  username: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Idol avatar URL',
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    example: 'Amazing idol from K-pop',
    description: 'Idol bio',
  })
  bio?: string | null;
}

export class CommunityDetailDto extends CommunityDto {
  @ApiProperty({
    type: [IdolDto],
    description: 'List of idols belonging to the community',
  })
  idols: IdolDto[];

  @ApiProperty({
    type: Number,
    description: 'Total number of members (followers) in the community',
    example: 1250,
  })
  totalMember: number;

  @ApiProperty({
    type: Number,
    description: 'Total number of idols in the community',
    example: 5,
  })
  totalIdol: number;

  @ApiPropertyOptional({
    type: ChatChannelDto,
    description: 'Community chat channel if exists',
  })
  chatChannel?: ChatChannelDto;
}
