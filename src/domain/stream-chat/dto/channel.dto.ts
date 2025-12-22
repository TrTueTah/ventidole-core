import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class StreamChannelDto {
  @ApiProperty({
    description: 'Channel type',
    example: 'messaging',
  })
  type: string;

  @ApiProperty({
    description: 'Channel ID',
    example: 'channel_123',
  })
  id: string;

  @ApiProperty({
    description: 'Channel CID (combination of type and id)',
    example: 'messaging:channel_123',
  })
  cid: string;

  @ApiPropertyOptional({
    description: 'Channel name',
    example: 'General Discussion',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Channel description',
    example: 'A place for general discussion',
  })
  description?: string;

  @ApiProperty({
    description: 'Array of member user IDs',
    type: [String],
    example: ['user_1', 'user_2'],
  })
  members: string[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  created_at: string;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00Z',
  })
  updated_at: string;
}
