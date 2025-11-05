import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { ServiceAccount } from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseService.name);
  private firebaseApp: admin.app.App;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      // Option 1: Using service account JSON file path
      const serviceAccountPath = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_PATH');
      
      // Option 2: Using service account JSON object from env
      const serviceAccountJson = this.configService.get<string>('FIREBASE_SERVICE_ACCOUNT_JSON');

      let credential: admin.credential.Credential;

      if (serviceAccountJson) {
        // Parse JSON from environment variable
        const serviceAccount: ServiceAccount = JSON.parse(serviceAccountJson);
        credential = admin.credential.cert(serviceAccount);
      } else if (serviceAccountPath) {
        // Load from file path
        credential = admin.credential.cert(serviceAccountPath);
      } else {
        // Use application default credentials (works in GCP environments)
        credential = admin.credential.applicationDefault();
      }

      this.firebaseApp = admin.initializeApp({
        credential,
        databaseURL: this.configService.get<string>('FIREBASE_DATABASE_URL'),
        storageBucket: this.configService.get<string>('FIREBASE_STORAGE_BUCKET'),
      });

      this.logger.log('[FIREBASE] Initialized successfully');
    } catch (error) {
      this.logger.error('[FIREBASE] Initialization failed:', error);
      // Don't throw - allow app to start even if Firebase is not configured
    }
  }

  getApp(): admin.app.App {
    return this.firebaseApp;
  }

  // Firestore methods
  getFirestore(): admin.firestore.Firestore {
    return this.firebaseApp.firestore();
  }

  // Realtime Database methods
  getDatabase(): admin.database.Database {
    return this.firebaseApp.database();
  }

  // Authentication methods
  getAuth(): admin.auth.Auth {
    return this.firebaseApp.auth();
  }

  // Storage methods
  getStorage(): admin.storage.Storage {
    return this.firebaseApp.storage();
  }

  // Messaging methods
  getMessaging(): admin.messaging.Messaging {
    return this.firebaseApp.messaging();
  }

  // Example: Verify Firebase ID token
  async verifyIdToken(idToken: string): Promise<admin.auth.DecodedIdToken> {
    return this.getAuth().verifyIdToken(idToken);
  }

  // Example: Send push notification
  async sendPushNotification(token: string, notification: { title: string; body: string; data?: any }) {
    const message: admin.messaging.Message = {
      token,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: notification.data,
    };

    return this.getMessaging().send(message);
  }

  // Example: Create custom token for user
  async createCustomToken(uid: string, claims?: object): Promise<string> {
    return this.getAuth().createCustomToken(uid, claims);
  }
}
