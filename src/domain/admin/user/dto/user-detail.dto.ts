import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserDto } from './user.dto';

export class CommunityInfoDto {
  @ApiPropertyOptional({ example: 'clxxxxxxx', description: 'Community ID' })
  id?: string | null;

  @ApiPropertyOptional({
    example: 'K-Pop Fans Community',
    description: 'Community name',
  })
  name?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Community avatar URL',
  })
  avatarUrl?: string | null;

  @ApiPropertyOptional({
    example: 'https://example.com/background.jpg',
    description: 'Community background URL',
  })
  backgroundUrl?: string | null;

  @ApiPropertyOptional({
    example: 'A community for K-Pop fans',
    description: 'Community description',
  })
  description?: string | null;

  @ApiPropertyOptional({
    example: 100,
    description: 'Total members in the community',
  })
  totalMembers?: number;
}

export class UserDetailDto extends UserDto {
  @ApiPropertyOptional({
    description: 'Community information (only for IDOL role)',
    type: CommunityInfoDto,
  })
  community?: CommunityInfoDto | null;
}
