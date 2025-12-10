import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ChannelDto {
  @ApiProperty({
    example: 'messaging:channel-123',
    description: 'Channel ID (cid)',
  })
  id: string;

  @ApiProperty({
    example: 'messaging',
    description: 'Channel type',
  })
  type: string;

  @ApiPropertyOptional({
    example: 'General Discussion',
    description: 'Channel name',
  })
  name?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/image.jpg',
    description: 'Channel image URL',
  })
  image?: string;

  @ApiProperty({
    example: ['user_1', 'user_2'],
    description: 'Channel member IDs',
    type: [String],
  })
  memberIds: string[];

  @ApiProperty({
    example: 2,
    description: 'Number of members',
  })
  memberCount: number;

  @ApiPropertyOptional({
    example: {
      id: 'msg_123',
      text: 'Hello!',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
    description: 'Last message in the channel',
  })
  lastMessage?: {
    id: string;
    text: string;
    createdAt: string;
    user?: {
      id: string;
      name: string;
    };
  };

  @ApiProperty({
    example: 0,
    description: 'Unread message count',
  })
  unreadCount: number;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Channel creation timestamp',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Channel last update timestamp',
  })
  updatedAt: string;
}
