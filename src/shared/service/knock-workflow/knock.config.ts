import { Knock } from '@knocklabs/node';

let knockClient: Knock | null = null;

export const getKnockClient = (): Knock => {
  if (!knockClient) {
    const apiKey = process.env.KNOCK_SECRET_KEY || process.env.KNOCK_API_KEY;

    if (!apiKey) {
      throw new Error(
        'KNOCK_SECRET_KEY or KNOCK_API_KEY must be defined in environment variables',
      );
    }

    knockClient = new Knock({ apiKey });
  }

  return knockClient;
};

export const getKnockPublicApiKey = (): string => {
  const publicApiKey = process.env.KNOCK_PUBLIC_API_KEY;

  if (!publicApiKey) {
    throw new Error(
      'KNOCK_PUBLIC_API_KEY must be defined in environment variables',
    );
  }

  return publicApiKey;
};

// Knock channel IDs
export const KNOCK_CHANNELS = {
  PUSH: process.env.KNOCK_PUSH_CHANNEL_ID || '',
  IN_APP: process.env.KNOCK_IN_APP_CHANNEL_ID || '',
  EMAIL: process.env.KNOCK_EMAIL_CHANNEL_ID || '',
} as const;

// Knock workflow keys for Ventidole
export const KNOCK_WORKFLOWS = {
  // Community workflows
  COMMUNITY_NEW_POST: 'community-new-post',
  COMMUNITY_JOINED: 'community-joined',
  POST_LIKED: 'post-liked',
  POST_COMMENTED: 'post-commented',

  // Chat workflows
  CHANNEL_CREATED: 'channel-created',

  // Order workflows
  CONFIRM_ORDER: 'confirm-order',
  ORDER_SHIPPED: 'order-shipped',
  ORDER_DELIVERED: 'order-delivered',

  // System workflows
  BANNER_CREATED: 'banner-created',
} as const;

export type KnockWorkflowKey =
  (typeof KNOCK_WORKFLOWS)[keyof typeof KNOCK_WORKFLOWS];
