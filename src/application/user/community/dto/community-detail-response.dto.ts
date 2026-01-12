import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CommunityResponseDto } from './community-response.dto';

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

export class ChatChannelDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  name?: string;

  @ApiProperty({ required: false })
  image?: string;

  @ApiProperty()
  memberCount: number;
}

export class CommunityDetailResponseDto extends CommunityResponseDto {
  @ApiProperty({
    type: [IdolDto],
    description: 'List of idols belonging to the community',
  })
  idols: IdolDto[];

  @ApiPropertyOptional({
    type: ChatChannelDto,
    description: 'Community chat channel if exists',
  })
  chatChannel?: ChatChannelDto;
}
