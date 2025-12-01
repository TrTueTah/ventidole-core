import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateIdolRequest {
  @ApiPropertyOptional({ description: 'Idol username' })
  @IsOptional()
  @IsString()
  username?: string;

  @ApiPropertyOptional({ description: 'Avatar URL' })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({ description: 'Background URL' })
  @IsOptional()
  @IsString()
  backgroundUrl?: string;

  @ApiPropertyOptional({ description: 'Bio' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ description: 'Community ID' })
  @IsOptional()
  @IsString()
  communityId?: string;
}
