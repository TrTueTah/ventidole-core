# PostgreSQL + Firebase Integration - Quick Start

Perfect choice for mobile apps! This guide will get you up and running with Firebase + PostgreSQL in **10 minutes**.

## 🎯 What You Have

- ✅ **PostgreSQL** (already set up via Prisma) - User accounts, orders, transactions
- ✅ **Firebase Module** (ready to use) - Real-time features, push notifications, file storage
- ✅ **Example Controller** (working API) - Chat, presence, notifications examples

## 🚀 Setup (3 Steps)

### Step 1: Get Firebase Credentials (5 min)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or select existing)
3. Go to **Project Settings** (⚙️ icon) → **Service Accounts**
4. Click **Generate New Private Key**
5. Save the JSON file to your project root as `serviceAccountKey.json`

### Step 2: Configure Environment (2 min)

Add to your `.env` file:

```bash
# Firebase Configuration
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://YOUR-PROJECT-ID.firebaseio.com
FIREBASE_STORAGE_BUCKET=YOUR-PROJECT-ID.appspot.com
```

**Replace `YOUR-PROJECT-ID`** with your actual Firebase project ID (found in Firebase Console).

### Step 3: Import Module (1 min)

Edit `src/app.module.ts`:

```typescript
import { FirebaseModule } from '@shared/service/firebase/firebase.module';

@Module({
  imports: [
    // ... your existing imports
    FirebaseModule,  // ← Add this line
  ],
})
export class AppModule {}
```

## ✅ Test It

```bash
# Start your server
npm run start:dev

# Test health check
curl http://localhost:8080/v1/examples/databases/health
```

**Expected response:**
```json
{
  "postgresql": true,
  "firestore": true
}
```

## 🎨 What You Can Build

### 1. Real-time Chat 💬

**Backend** (Already implemented in `MultiDatabaseService`):
```typescript
await multiDb.sendChatMessage(roomId, senderId, message);
```

**Mobile App** (React Native):
```typescript
firestore()
  .collection('chat_rooms')
  .doc(roomId)
  .collection('messages')
  .onSnapshot(snapshot => {
    // Messages update in real-time! 🚀
    setMessages(snapshot.docs);
  });
```

### 2. Online Presence 🟢

**Update status:**
```typescript
await multiDb.updatePresence(userId, true); // User is online
```

**Watch in mobile app:**
```typescript
firestore()
  .collection('users')
  .doc(userId)
  .onSnapshot(doc => {
    const { isOnline } = doc.data();
    // Show green dot if online! 🟢
  });
```

### 3. Push Notifications 🔔

**Send from backend:**
```typescript
await multiDb.sendPushNotification(
  userId,
  'New Message',
  'You have a new message from John'
);
```

**Receive on mobile:**
```typescript
// Notification appears on device automatically!
```

## 📱 Mobile App Setup

### React Native

```bash
npm install @react-native-firebase/app @react-native-firebase/firestore
```

### Flutter

```bash
flutter pub add firebase_core firebase_firestore
```

## 🗂️ File Structure

```
src/
├── shared/service/
│   ├── firebase/
│   │   ├── firebase.module.ts      ← Firebase module
│   │   └── firebase.service.ts     ← All Firebase features
│   │
│   ├── multi-database/
│   │   ├── multi-database.module.ts
│   │   └── multi-database.service.ts  ← Example usage
│   │
│   └── prisma/
│       └── prisma.service.ts       ← PostgreSQL (existing)
│
├── domain/example/
│   └── example-database.controller.ts  ← Working API examples
│
docs/
├── FIREBASE_MOBILE_GUIDE.md        ← Complete guide (this file)
└── FIREBASE_QUICK_START.md         ← You are here!
```

## 📚 API Examples

All examples are in: `src/domain/example/example-database.controller.ts`

### Register User

```bash
POST /v1/examples/databases/users/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "secure123",
  "fcmToken": "device-token-for-push-notif"
}
```

### Send Chat Message

```bash
POST /v1/examples/databases/chat/room-123/messages
{
  "senderId": "user-id",
  "message": "Hello!"
}
```

### Get Chat Messages

```bash
GET /v1/examples/databases/chat/room-123/messages?limit=50
```

### Update Presence

```bash
POST /v1/examples/databases/users/user-id/presence
{
  "isOnline": true
}
```

### Send Notification

```bash
POST /v1/examples/databases/users/user-id/notifications
{
  "title": "New Message",
  "body": "You got a message!",
  "data": {
    "type": "chat",
    "roomId": "room-123"
  }
}
```

## 💡 Architecture Overview

```
┌─────────────────┐
│   Mobile App    │
│ (React Native)  │
└────────┬────────┘
         │
    API Calls
         │
┌────────▼────────┐
│  NestJS Backend │
└────┬───────┬────┘
     │       │
     │       └─────────────┐
     │                     │
┌────▼──────┐    ┌────────▼────────┐
│PostgreSQL │    │    Firebase     │
│  (Prisma) │    │  - Firestore    │
│           │    │  - Messaging    │
│  Source   │    │  - Storage      │
│  of Truth │    │  - Auth         │
└───────────┘    └─────────────────┘
```

## 🔐 Security Rules (Firebase)

In Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own profile
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId;
    }
    
    // Authenticated users can read/write messages
    match /chat_rooms/{roomId}/messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.senderId;
    }
  }
}
```

## 💰 Costs

**Firebase Free Tier:**
- ✅ 1 GB Firestore storage
- ✅ 50K document reads/day
- ✅ 20K document writes/day
- ✅ 5 GB Storage
- ✅ Unlimited push notifications

**Perfect for:**
- ✅ Development
- ✅ Small apps
- ✅ MVPs
- ✅ Side projects

**Cost at scale:**
- Small app (1K users): **Free**
- Medium app (10K users): **$10-30/month**
- Large app (100K users): **$50-200/month**

## 🚀 Next Steps

1. ✅ **Complete setup** (follow steps above)
2. ✅ **Test health check** 
3. ✅ **Read** `docs/FIREBASE_MOBILE_GUIDE.md` for detailed examples
4. ✅ **Study** `src/domain/example/example-database.controller.ts` for working code
5. ✅ **Build** your first real-time feature!

## 🆘 Troubleshooting

### Firebase not connecting

**Problem:** Health check shows `firestore: false`

**Solution:**
1. Check `serviceAccountKey.json` path in `.env`
2. Verify the JSON file is valid
3. Make sure Firebase project exists
4. Enable Firestore in Firebase Console

### Mobile app can't connect

**Problem:** Mobile app shows permission errors

**Solution:**
1. Set up Firebase in mobile app (add `google-services.json` or `GoogleService-Info.plist`)
2. Configure Firestore security rules (see above)
3. Generate custom token on backend for authentication

### Push notifications not working

**Problem:** Notifications don't appear on device

**Solution:**
1. Enable Cloud Messaging API in Firebase Console
2. Request notification permissions in mobile app
3. Send FCM token to backend during registration
4. Test with Firebase Console test message first

## 📖 Full Documentation

- **[FIREBASE_MOBILE_GUIDE.md](./FIREBASE_MOBILE_GUIDE.md)** - Complete guide with all features
- **[Firebase Admin SDK Docs](https://firebase.google.com/docs/admin/setup)** - Official documentation
- **[React Native Firebase](https://rnfirebase.io/)** - Mobile SDK for React Native
- **[FlutterFire](https://firebase.flutter.dev/)** - Mobile SDK for Flutter

## ✨ Features Included

- ✅ User registration with Firestore profiles
- ✅ Real-time chat with instant sync
- ✅ Online/offline presence tracking
- ✅ Push notifications (FCM)
- ✅ File uploads to Firebase Storage
- ✅ Custom authentication tokens
- ✅ Health monitoring
- ✅ Complete working examples

---

**Ready?** Start with **Step 1** above! 🚀

**Questions?** Check `docs/FIREBASE_MOBILE_GUIDE.md` for detailed explanations.
