import { StreamChat } from 'stream-chat';
import { ENVIRONMENT } from './env.config';

let streamChatClient: StreamChat | null = null;

export const getStreamChatApiKey = () => {
  if (!ENVIRONMENT.STREAM_CHAT_API_KEY) {
    throw new Error(
      'STREAM_CHAT_API_KEY must be defined in environment variables',
    );
  }
  return ENVIRONMENT.STREAM_CHAT_API_KEY;
};

const getStreamChatClient = (): StreamChat => {
  if (streamChatClient) {
    return streamChatClient;
  }

  const apiKey = ENVIRONMENT.STREAM_CHAT_API_KEY;
  const secret = ENVIRONMENT.STREAM_CHAT_SECRET;

  if (!apiKey || !secret) {
    throw new Error(
      'STREAM_CHAT_API_KEY and STREAM_CHAT_SECRET must be defined in environment variables',
    );
  }

  streamChatClient = StreamChat.getInstance(apiKey, secret);
  return streamChatClient;
};

export default getStreamChatClient;
