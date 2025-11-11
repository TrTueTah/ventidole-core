export interface ChatMessage {
  id: string;
  channelId: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  type: string;
  content: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  metadata?: Record<string, any>;
  replyTo?: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted: boolean;
  readBy?: string[];
}

export interface ChatChannelMetadata {
  lastMessage?: {
    content: string;
    senderId: string;
    senderName: string;
    createdAt: Date;
  };
  participantCount: number;
  messageCount: number;
}
