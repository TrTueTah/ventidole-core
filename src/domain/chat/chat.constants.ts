export const ChatConstants = {
  // Pagination
  DEFAULT_MESSAGE_LIMIT: 50,
  MAX_MESSAGE_LIMIT: 100,

  // Participant limits
  MAX_PARTICIPANTS_PER_CHANNEL: 500,
  MAX_PARTICIPANTS_GROUP_CHAT: 100,

  // WebSocket
  TYPING_TIMEOUT: 3000, // 3 seconds

  // Timeouts
  MESSAGE_EDIT_TIMEOUT: 900000, // 15 minutes

  // Rate limiting
  MAX_MESSAGES_PER_MINUTE: 30,

  // CORS
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
} as const;
