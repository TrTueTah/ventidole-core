import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import * as admin from 'firebase-admin';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface MulticastNotificationPayload extends PushNotificationPayload {
  tokens: string[];
}

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  /**
   * Send push notification to a single device
   */
  async sendToDevice(
    token: string,
    payload: PushNotificationPayload
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        token,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data,
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
      };

      const messageId = await this.firebaseService.getMessaging().send(message);
      this.logger.log(`Successfully sent message: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(`Error sending notification to device: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send push notification to multiple devices (multicast)
   */
  async sendToMultipleDevices(
    payload: MulticastNotificationPayload
  ): Promise<admin.messaging.BatchResponse> {
    try {
      const message: admin.messaging.MulticastMessage = {
        tokens: payload.tokens,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data,
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
      };

      const response = await this.firebaseService.getMessaging().sendEachForMulticast(message);
      this.logger.log(`Successfully sent ${response.successCount} messages`);
      
      if (response.failureCount > 0) {
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            this.logger.error(`Failed to send to token ${payload.tokens[idx]}: ${resp.error?.message}`);
          }
        });
      }

      return response;
    } catch (error) {
      this.logger.error(`Error sending multicast notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Send notification to a topic
   */
  async sendToTopic(
    topic: string,
    payload: PushNotificationPayload
  ): Promise<string> {
    try {
      const message: admin.messaging.Message = {
        topic,
        notification: {
          title: payload.title,
          body: payload.body,
          ...(payload.imageUrl && { imageUrl: payload.imageUrl }),
        },
        data: payload.data,
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default',
            },
          },
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            priority: 'high',
          },
        },
      };

      const messageId = await this.firebaseService.getMessaging().send(message);
      this.logger.log(`Successfully sent message to topic ${topic}: ${messageId}`);
      return messageId;
    } catch (error) {
      this.logger.error(`Error sending notification to topic: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Subscribe devices to a topic
   */
  async subscribeToTopic(tokens: string[], topic: string): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      const response = await this.firebaseService.getMessaging().subscribeToTopic(tokens, topic);
      this.logger.log(`Successfully subscribed ${response.successCount} devices to topic: ${topic}`);
      return response;
    } catch (error) {
      this.logger.error(`Error subscribing to topic: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Unsubscribe devices from a topic
   */
  async unsubscribeFromTopic(tokens: string[], topic: string): Promise<admin.messaging.MessagingTopicManagementResponse> {
    try {
      const response = await this.firebaseService.getMessaging().unsubscribeFromTopic(tokens, topic);
      this.logger.log(`Successfully unsubscribed ${response.successCount} devices from topic: ${topic}`);
      return response;
    } catch (error) {
      this.logger.error(`Error unsubscribing from topic: ${error.message}`, error.stack);
      throw error;
    }
  }
}
