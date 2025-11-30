export * from './chat.response';
export * from './paginated-messages.response';

import { ChatChannelResponse, ChatMessageResponse, ChatParticipantResponse } from './chat.response';
import { PaginatedMessagesResponse } from './paginated-messages.response';

export const chatResponses = [
  ChatChannelResponse,
  ChatMessageResponse,
  ChatParticipantResponse,
  PaginatedMessagesResponse,
];
