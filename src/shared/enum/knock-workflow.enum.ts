export enum KnockWorkflow {
  // Community workflows
  COMMUNITY_NEW_POST = 'community-new-post',
  COMMUNITY_JOINED = 'community-joined',
  POST_LIKED = 'post-liked',
  POST_COMMENTED = 'post-commented',

  // Chat workflows
  NEW_MESSAGE = 'new-message',
  CHANNEL_INVITATION = 'channel-invitation',
  CHANNEL_CREATED = 'channel-created',

  // Order workflows
  CONFIRM_ORDER = 'confirm-order',
  ORDER_SHIPPED = 'order-shipped',
  ORDER_DELIVERED = 'order-delivered',

  // Payment workflows
  PAYMENT_SUCCESS = 'payment-success',
  PAYMENT_FAILED = 'payment-failed',
}
