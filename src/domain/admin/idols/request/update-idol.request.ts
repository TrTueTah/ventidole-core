import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateIdolRequest {
  @ApiPropertyOptional({ description: 'Idol stage name' })
  @IsOptional()
  @IsString()
  stageName?: string;

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
