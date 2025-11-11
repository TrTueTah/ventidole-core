import { ApiProperty } from '@nestjs/swagger';

export class ChatChannelResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name?: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  groupId?: string;

  @ApiProperty()
  idolId?: string;

  @ApiProperty()
  isAnnouncement: boolean;

  @ApiProperty()
  firebaseDocId: string;

  @ApiProperty()
  lastMessageAt?: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  participants?: ChatParticipantResponse[];

  @ApiProperty({ required: false })
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
  };

  @ApiProperty({ required: false })
  unreadCount?: number;
}

export class ChatParticipantResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  role: string;

  @ApiProperty()
  lastReadAt?: Date;

  @ApiProperty()
  unreadCount: number;

  @ApiProperty()
  isMuted: boolean;

  @ApiProperty({ required: false })
  user?: {
    id: string;
    email: string;
    role: string;
    isOnline: boolean;
    fan?: any;
    idol?: any;
  };
}

export class ChatMessageResponse {
  @ApiProperty()
  id: string;

  @ApiProperty()
  channelId: string;

  @ApiProperty()
  senderId: string;

  @ApiProperty()
  senderName: string;

  @ApiProperty()
  senderAvatar?: string;

  @ApiProperty()
  type: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  mediaUrl?: string;

  @ApiProperty()
  thumbnailUrl?: string;

  @ApiProperty({ required: false })
  metadata?: Record<string, any>;

  @ApiProperty()
  replyTo?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty({ type: [String], required: false })
  readBy?: string[];
}
