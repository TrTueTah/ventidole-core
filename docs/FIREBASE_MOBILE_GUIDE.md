# Firebase + PostgreSQL Integration for Mobile Apps

Complete guide for building mobile apps with real-time features using Firebase and PostgreSQL.

## 🎯 Overview

This architecture combines the best of both worlds:
- **PostgreSQL** - Your source of truth for user accounts, orders, transactions
- **Firebase** - Real-time features, offline support, push notifications for mobile

## 🏗️ Architecture

```
Mobile App (React Native/Flutter)
         ↓
    Your NestJS API
         ↓
    ┌─────────┴─────────┐
    ↓                   ↓
PostgreSQL          Firebase
(Prisma)        (Admin SDK)
    ↓                   ↓
- Users            - Firestore (real-time data)
- Orders           - Cloud Messaging (push notifications)
- Transactions     - Storage (file uploads)
                   - Auth (custom tokens)
```

## 📦 What's Included

### ✅ Modules
- `FirebaseModule` - Global Firebase service
- `MultiDatabaseModule` - Integration service
- `ExampleDatabaseController` - Working examples

### ✅ Features
- User registration with Firebase profiles
- Real-time chat with Firestore
- Online presence tracking
- Push notifications
- File storage (avatars, media)
- Custom authentication tokens

## 🚀 Quick Start

### 1. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create or select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Save as `serviceAccountKey.json`

### 2. Configure Environment

Add to `.env`:

```bash
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

### 3. Import Firebase Module

Update `src/app.module.ts`:

```typescript
import { FirebaseModule } from '@shared/service/firebase/firebase.module';

@Module({
  imports: [
    // ... existing imports
    FirebaseModule,  // ← Add this
  ],
})
export class AppModule {}
```

### 4. Test It

```bash
npm run start:dev

# Test health check
curl http://localhost:8080/v1/examples/databases/health
```

## 💡 Use Cases

### When to Use PostgreSQL

✅ **User accounts & authentication**
```typescript
const user = await this.prisma.account.create({
  data: { email, password, name }
});
```

✅ **Orders & payments (transactions)**
```typescript
await this.prisma.$transaction([
  this.prisma.order.create({ ... }),
  this.prisma.payment.create({ ... }),
]);
```

✅ **Complex queries & relationships**
```typescript
const users = await this.prisma.account.findMany({
  where: { role: 'USER' },
  include: { orders: true }
});
```

### When to Use Firebase

✅ **Real-time chat**
```typescript
// Backend sends message
await firestore.collection('chat_rooms')
  .doc(roomId)
  .collection('messages')
  .add({ message, senderId, timestamp });

// Mobile app listens in real-time
firestore.collection('chat_rooms')
  .doc(roomId)
  .collection('messages')
  .orderBy('timestamp')
  .onSnapshot(snapshot => {
    // Update UI instantly!
  });
```

✅ **Online presence**
```typescript
// Update when user goes online/offline
await firestore.collection('users').doc(userId).update({
  isOnline: true,
  lastSeen: admin.firestore.FieldValue.serverTimestamp()
});

// Other users see status in real-time
```

✅ **Push notifications**
```typescript
await messaging.send({
  token: userFcmToken,
  notification: {
    title: 'New Message',
    body: 'You have a new message!'
  }
});
```

✅ **File uploads**
```typescript
const bucket = storage.bucket();
await bucket.file(`avatars/${userId}/photo.jpg`).save(fileBuffer);
```

## 📱 Mobile App Integration

### Setup Firebase SDK in Mobile App

**React Native:**
```bash
npm install @react-native-firebase/app @react-native-firebase/firestore
```

**Flutter:**
```bash
flutter pub add firebase_core firebase_firestore
```

### Real-time Listeners

```typescript
// In your React Native/Flutter app
firestore()
  .collection('chat_rooms')
  .doc(roomId)
  .collection('messages')
  .orderBy('timestamp', 'desc')
  .onSnapshot(snapshot => {
    const messages = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    setMessages(messages); // Update UI
  });
```

### Push Notifications

```typescript
// Get FCM token on mobile
const fcmToken = await messaging().getToken();

// Send to your backend during registration
await api.post('/users/register', {
  email,
  password,
  name,
  fcmToken // ← Send this
});
```

## 🔐 Authentication Flow

### Backend Custom Token Generation

```typescript
// Generate custom token for Firebase Auth
const customToken = await firebaseService.createCustomToken(userId);

// Return to mobile app
return { customToken };
```

### Mobile Sign-in

```typescript
// Mobile app signs in with custom token
const userCredential = await auth().signInWithCustomToken(customToken);

// Now mobile can access Firestore with security rules
```

### Firestore Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Chat room members can read messages
    match /chat_rooms/{roomId}/messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.senderId;
    }
  }
}
```

## 📝 API Examples

### 1. Register User

```bash
POST /v1/examples/databases/users/register
Content-Type: application/json

{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "secure123",
  "fcmToken": "mobile-device-token"
}
```

**Response:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe"
  },
  "firestoreProfile": true,
  "fcmTokenSaved": true
}
```

### 2. Send Chat Message

```bash
POST /v1/examples/databases/chat/room123/messages
Content-Type: application/json

{
  "senderId": "user-id",
  "message": "Hello!"
}
```

### 3. Update Presence

```bash
POST /v1/examples/databases/users/user-id/presence
Content-Type: application/json

{
  "isOnline": true
}
```

### 4. Send Push Notification

```bash
POST /v1/examples/databases/users/user-id/notifications
Content-Type: application/json

{
  "title": "New Message",
  "body": "You have a new message from John",
  "data": {
    "type": "chat",
    "roomId": "room123"
  }
}
```

## 🔧 Configuration

### Firebase Service Account

Option 1: **File path** (recommended for local dev)
```bash
FIREBASE_SERVICE_ACCOUNT_PATH=/path/to/serviceAccountKey.json
```

Option 2: **JSON string** (recommended for production/Docker)
```bash
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account","project_id":"..."}'
```

### Firebase Project Settings

```bash
# Database URL (Realtime Database)
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com

# Storage Bucket
FIREBASE_STORAGE_BUCKET=your-project.appspot.com
```

## 📊 Data Structure Examples

### PostgreSQL (Prisma Schema)

```prisma
model Account {
  id        String   @id @default(uuid())
  email     String   @unique
  name      String
  password  String
  role      String   @default("USER")
  createdAt DateTime @default(now())
}
```

### Firebase Firestore Collections

```
users/
  ├── {userId}/
  │   ├── uid: string
  │   ├── email: string
  │   ├── displayName: string
  │   ├── isOnline: boolean
  │   ├── lastSeen: timestamp
  │   └── createdAt: timestamp

chat_rooms/
  ├── {roomId}/
  │   ├── lastMessage: string
  │   ├── lastMessageAt: timestamp
  │   ├── lastMessageBy: string
  │   └── messages/
  │       └── {messageId}/
  │           ├── senderId: string
  │           ├── message: string
  │           ├── timestamp: timestamp
  │           └── read: boolean

fcm_tokens/
  └── {userId}/
      ├── userId: string
      ├── tokens: string[]
      └── updatedAt: timestamp
```

## 🎨 Frontend Integration Examples

### React Native - Real-time Chat

```typescript
import firestore from '@react-native-firebase/firestore';
import { useState, useEffect } from 'react';

function ChatRoom({ roomId }) {
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    // Real-time listener
    const unsubscribe = firestore()
      .collection('chat_rooms')
      .doc(roomId)
      .collection('messages')
      .orderBy('timestamp', 'desc')
      .limit(50)
      .onSnapshot(snapshot => {
        const newMessages = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setMessages(newMessages);
      });

    return () => unsubscribe();
  }, [roomId]);

  const sendMessage = async (message) => {
    await firestore()
      .collection('chat_rooms')
      .doc(roomId)
      .collection('messages')
      .add({
        senderId: currentUserId,
        message,
        timestamp: firestore.FieldValue.serverTimestamp(),
        read: false
      });
  };

  return (
    // Your chat UI
  );
}
```

### Flutter - Push Notifications

```dart
import 'package:firebase_messaging/firebase_messaging.dart';

class NotificationService {
  final FirebaseMessaging _messaging = FirebaseMessaging.instance;

  Future<void> init() async {
    // Request permission
    await _messaging.requestPermission();

    // Get FCM token
    String? token = await _messaging.getToken();
    print('FCM Token: $token');

    // Send to your backend
    await api.registerUser(email, password, name, fcmToken: token);

    // Listen for messages
    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      print('Got a message: ${message.notification?.title}');
      // Show notification
    });
  }
}
```

## 🚀 Deployment

### Environment Variables (Production)

```bash
# Use JSON string for Firebase credentials (not file path)
FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
FIREBASE_DATABASE_URL=https://your-project.firebaseio.com
FIREBASE_STORAGE_BUCKET=your-project.appspot.com

# PostgreSQL
DATABASE_URL=postgresql://...
```

### Docker

```dockerfile
FROM node:18-alpine

WORKDIR /app
COPY . .

# Don't copy serviceAccountKey.json - use environment variable instead
ENV FIREBASE_SERVICE_ACCOUNT_JSON='...'

RUN npm install
RUN npm run build

CMD ["npm", "run", "start:prod"]
```

## 💰 Costs

### Firebase Pricing

**Free Tier (Spark Plan):**
- ✅ 1 GB Firestore storage
- ✅ 10K document reads/day
- ✅ 20K document writes/day
- ✅ 20K document deletes/day
- ✅ 5 GB Storage
- ✅ 1 GB downloads/day

**Paid Tier (Blaze Plan - Pay as you go):**
- $0.06 per 100K document reads
- $0.18 per 100K document writes
- $0.02 per 100K document deletes
- $0.026 per GB storage/month

**Typical Small App:** $0-10/month
**Medium App (10K active users):** $20-50/month

## 🔍 Monitoring

### Health Check

```bash
GET /v1/examples/databases/health

Response:
{
  "postgresql": true,
  "firestore": true
}
```

### Firebase Console

Monitor usage at: https://console.firebase.google.com
- Database usage
- Storage usage
- Function invocations
- Crashlytics

## 🆘 Troubleshooting

### Firebase not connecting

1. Check service account JSON is valid
2. Verify project ID in credentials
3. Check Firebase project settings
4. Ensure Firebase APIs are enabled

### Push notifications not working

1. Verify FCM token is saved
2. Check mobile app has notification permissions
3. Verify Firebase Cloud Messaging API is enabled
4. Test with Firebase Console test message

### Real-time updates not working

1. Check Firestore security rules
2. Verify mobile app is authenticated
3. Check listener is properly set up
4. Monitor Firebase Console for errors

## 📚 Additional Resources

- [Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)
- [Firestore Data Model](https://firebase.google.com/docs/firestore/data-model)
- [Cloud Messaging Guide](https://firebase.google.com/docs/cloud-messaging)
- [React Native Firebase](https://rnfirebase.io/)
- [FlutterFire](https://firebase.flutter.dev/)

## 🎯 Next Steps

1. ✅ Set up Firebase project
2. ✅ Import FirebaseModule in app.module.ts
3. ✅ Test health check endpoint
4. ✅ Implement user registration
5. ✅ Add real-time chat
6. ✅ Set up push notifications
7. ✅ Configure Firestore security rules
8. ✅ Integrate with mobile app

---

**Questions?** Check the example controller at `src/domain/example/example-database.controller.ts` for working code samples!
