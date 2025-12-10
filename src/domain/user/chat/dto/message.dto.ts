import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MessageDto {
  @ApiProperty({
    example: 'msg_123',
    description: 'Message ID',
  })
  id: string;

  @ApiProperty({
    example: 'Hello, how are you?',
    description: 'Message text content',
  })
  text: string;

  @ApiProperty({
    example: {
      id: 'user_123',
      name: 'John Doe',
      image: 'https://example.com/avatar.jpg',
    },
    description: 'Message sender information',
  })
  user: {
    id: string;
    name: string;
    image?: string;
  };

  @ApiPropertyOptional({
    example: ['https://example.com/image1.jpg'],
    description: 'Attached images',
    type: [String],
  })
  attachments?: {
    type: string;
    image_url?: string;
    file_size?: number;
    mime_type?: string;
  }[];

  @ApiPropertyOptional({
    example: { like: ['user_1', 'user_2'] },
    description: 'Message reactions',
  })
  reactions?: Record<string, string[]>;

  @ApiPropertyOptional({
    example: 'msg_parent_123',
    description: 'Parent message ID (for replies)',
  })
  parentId?: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Message creation timestamp',
  })
  createdAt: string;

  @ApiProperty({
    example: '2024-01-01T00:00:00.000Z',
    description: 'Message last update timestamp',
  })
  updatedAt: string;
}
