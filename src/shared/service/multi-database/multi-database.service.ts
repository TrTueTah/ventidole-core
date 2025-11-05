import { Injectable, Logger } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { FirebaseService } from '../firebase/firebase.service';

@Injectable()
export class MultiDatabaseService {
  private readonly logger = new Logger(MultiDatabaseService.name);

  constructor(
    private prisma: PrismaService,
    private firebaseService: FirebaseService,
  ) {}

  async registerUser(email: string, name: string, password: string, fcmToken?: string) {
    const user = await this.prisma.account.create({
      data: { email, password, name, role: 'FAN' },
    });

    const firestore = this.firebaseService.getFirestore();
    await firestore.collection('users').doc(user.id).set({
      uid: user.id,
      email: user.email,
      displayName: user.name,
      isOnline: true,
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      fcmToken: fcmToken || null,
    });

    if (fcmToken) {
      await firestore.collection('fcm_tokens').doc(user.id).set({
        userId: user.id,
        tokens: [fcmToken],
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { user, firestoreProfile: true, fcmTokenSaved: !!fcmToken };
  }

  async sendChatMessage(roomId: string, senderId: string, message: string) {
    const firestore = this.firebaseService.getFirestore();
    
    const messageRef = await firestore
      .collection('chat_rooms')
      .doc(roomId)
      .collection('messages')
      .add({
        senderId,
        message,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        read: false,
      });

    await firestore.collection('chat_rooms').doc(roomId).set({
      lastMessage: message,
      lastMessageAt: admin.firestore.FieldValue.serverTimestamp(),
      lastMessageBy: senderId,
    }, { merge: true });

    return { messageId: messageRef.id, roomId };
  }

  async getChatMessages(roomId: string, limit: number = 50) {
    const firestore = this.firebaseService.getFirestore();
    
    const messagesSnapshot = await firestore
      .collection('chat_rooms')
      .doc(roomId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    return messagesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  async updatePresence(userId: string, isOnline: boolean) {
    const firestore = this.firebaseService.getFirestore();
    
    await firestore.collection('users').doc(userId).update({
      isOnline,
      lastSeen: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { userId, isOnline };
  }

  async sendPushNotification(userId: string, title: string, body: string, data?: Record<string, string>) {
    const messaging = this.firebaseService.getMessaging();
    const firestore = this.firebaseService.getFirestore();

    const tokenDoc = await firestore.collection('fcm_tokens').doc(userId).get();
    const tokenData = tokenDoc.data();

    if (!tokenData || !tokenData.tokens || tokenData.tokens.length === 0) {
      this.logger.warn(`No FCM tokens found for user: ${userId}`);
      return { sent: 0 };
    }

    const messages = tokenData.tokens.map((token: string) => ({
      token,
      notification: { title, body },
      data: data || {},
    }));

    const response = await messaging.sendEach(messages);
    
    return {
      sent: response.successCount,
      failed: response.failureCount,
    };
  }

  async healthCheck() {
    const health = {
      postgresql: false,
      firestore: false,
    };

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      health.postgresql = true;
    } catch (error) {
      this.logger.error('PostgreSQL health check failed', error);
    }

    try {
      const firestore = this.firebaseService.getFirestore();
      await firestore.collection('_health_check').doc('test').set({ 
        timestamp: admin.firestore.FieldValue.serverTimestamp() 
      });
      health.firestore = true;
    } catch (error) {
      this.logger.error('Firestore health check failed', error);
    }

    return health;
  }
}
