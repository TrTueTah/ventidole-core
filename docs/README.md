# Firebase Integration for Mobile Apps 🚀

Complete Firebase + PostgreSQL integration for building mobile apps with real-time features.

## 🎯 Why This Architecture?

**Perfect for mobile apps** because:
- ✅ **PostgreSQL** - Your reliable source of truth for critical data (users, payments, orders)
- ✅ **Firebase** - Real-time magic for mobile apps (chat, presence, push notifications, offline support)

## 📦 What's Included

### Ready-to-Use Modules
```
src/shared/service/
├── firebase/              Firebase integration
│   ├── firebase.module.ts
│   └── firebase.service.ts
├── multi-database/        Integration service
│   ├── multi-database.module.ts
│   └── multi-database.service.ts
└── prisma/               PostgreSQL (existing)
    └── prisma.service.ts
```

### Working Examples
- `src/domain/example/example-database.controller.ts` - Complete API with:
  - User registration with Firebase profiles
  - Real-time chat
  - Online presence tracking
  - Push notifications
  - Health monitoring

## 🚀 Quick Start (10 Minutes)

### 1. Get Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create/select project
3. **Project Settings** → **Service Accounts** → **Generate New Private Key**
4. Save as `serviceAccountKey.json` in project root

### 2. Configure `.env`

```bash
FIREBASE_SERVICE_ACCOUNT_PATH=./serviceAccountKey.json
FIREBASE_DATABASE_URL=https://YOUR-PROJECT-ID.firebaseio.com
FIREBASE_STORAGE_BUCKET=YOUR-PROJECT-ID.appspot.com
```

### 3. Import Module

In `src/app.module.ts`:

```typescript
import { FirebaseModule } from '@shared/service/firebase/firebase.module';

@Module({
  imports: [
    // ... existing
    FirebaseModule,  // ← Add this
  ],
})
```

### 4. Test

```bash
npm run start:dev
curl http://localhost:8080/v1/examples/databases/health
```

## 💡 Key Features

### 1. Real-time Chat 💬

```typescript
// Backend sends message
await multiDb.sendChatMessage(roomId, senderId, message);

// Mobile app receives instantly (React Native)
firestore()
  .collection('chat_rooms')
  .doc(roomId)
  .collection('messages')
  .onSnapshot(snapshot => {
    setMessages(snapshot.docs); // Real-time updates! 🚀
  });
```

### 2. Online Presence 🟢

```typescript
// Update status
await multiDb.updatePresence(userId, true);

// Mobile listens for changes
firestore()
  .collection('users')
  .doc(userId)
  .onSnapshot(doc => {
    const { isOnline, lastSeen } = doc.data();
  });
```

### 3. Push Notifications 🔔

```typescript
// Send from backend
await multiDb.sendPushNotification(
  userId,
  'New Message',
  'You have a message from John'
);

// Appears on mobile device automatically!
```

### 4. File Uploads 📁

```typescript
// Upload avatar to Firebase Storage
const bucket = storage.bucket();
await bucket.file(`avatars/${userId}/photo.jpg`).save(fileBuffer);

// Get public URL
const url = `https://storage.googleapis.com/${bucket.name}/...`;
```

## 🏗️ Architecture

```
┌──────────────────┐
│   Mobile App     │
│ (React Native /  │
│    Flutter)      │
└────────┬─────────┘
         │
    REST API + Real-time Listeners
         │
┌────────▼─────────┐
│  NestJS Backend  │
│                  │
│  ┌────────────┐  │
│  │ Controllers│  │
│  └──────┬─────┘  │
│         │        │
│  ┌──────▼──────┐ │
│  │  Services   │ │
│  └──┬───────┬──┘ │
└─────┼───────┼────┘
      │       │
      │       └────────────────┐
      │                        │
┌─────▼──────┐        ┌───────▼────────┐
│ PostgreSQL │        │    Firebase    │
│  (Prisma)  │        │                │
│            │        │ - Firestore    │
│  Users     │        │ - Messaging    │
│  Orders    │        │ - Storage      │
│  Payments  │        │ - Auth         │
└────────────┘        └────────────────┘
```

## 📊 When to Use What

### PostgreSQL (via Prisma)
✅ User accounts & authentication  
✅ Orders & transactions (ACID)  
✅ Complex queries & relationships  
✅ Financial data  

```typescript
// Example: Create user
const user = await this.prisma.account.create({
  data: { email, password, name }
});
```

### Firebase (Firestore)
✅ Real-time chat messages  
✅ Online presence tracking  
✅ Push notifications  
✅ Mobile offline support  
✅ Live collaboration features  

```typescript
// Example: Real-time chat
await firestore
  .collection('chat_rooms')
  .doc(roomId)
  .collection('messages')
  .add({ message, senderId, timestamp });
```

## 📱 Mobile Integration

### React Native Setup

```bash
npm install @react-native-firebase/app @react-native-firebase/firestore
```

```typescript
import firestore from '@react-native-firebase/firestore';

// Real-time listener
useEffect(() => {
  const unsubscribe = firestore()
    .collection('chat_rooms')
    .doc(roomId)
    .collection('messages')
    .orderBy('timestamp', 'desc')
    .onSnapshot(snapshot => {
      const messages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messages);
    });

  return () => unsubscribe();
}, [roomId]);
```

### Flutter Setup

```bash
flutter pub add firebase_core firebase_firestore
```

```dart
StreamBuilder<QuerySnapshot>(
  stream: FirebaseFirestore.instance
      .collection('chat_rooms')
      .doc(roomId)
      .collection('messages')
      .orderBy('timestamp', descending: true)
      .snapshots(),
  builder: (context, snapshot) {
    if (!snapshot.hasData) return CircularProgressIndicator();
    
    final messages = snapshot.data!.docs;
    return ListView.builder(
      itemCount: messages.length,
      itemBuilder: (context, index) {
        final message = messages[index];
        return MessageWidget(message: message);
      },
    );
  },
)
```

## 🔐 Security Rules

In Firebase Console → Firestore → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
    
    // Chat messages - authenticated users only
    match /chat_rooms/{roomId}/messages/{messageId} {
      allow read: if request.auth != null;
      allow create: if request.auth.uid == request.resource.data.senderId;
    }
    
    // FCM tokens - user can only update their own
    match /fcm_tokens/{userId} {
      allow read, write: if request.auth.uid == userId;
    }
  }
}
```

## 📝 API Endpoints

All examples in: `src/domain/example/example-database.controller.ts`

### Health Check
```
GET /v1/examples/databases/health
```

### Register User
```
POST /v1/examples/databases/users/register
{
  "email": "user@example.com",
  "name": "John Doe",
  "password": "secure123",
  "fcmToken": "device-token"
}
```

### Send Chat Message
```
POST /v1/examples/databases/chat/:roomId/messages
{
  "senderId": "user-id",
  "message": "Hello!"
}
```

### Get Messages
```
GET /v1/examples/databases/chat/:roomId/messages?limit=50
```

### Update Presence
```
POST /v1/examples/databases/users/:userId/presence
{
  "isOnline": true
}
```

### Send Notification
```
POST /v1/examples/databases/users/:userId/notifications
{
  "title": "New Message",
  "body": "You have a new message!",
  "data": { "type": "chat", "roomId": "123" }
}
```

## 💰 Pricing

### Firebase Free Tier (Spark)
- ✅ 1 GB Firestore storage
- ✅ 50K reads/day
- ✅ 20K writes/day
- ✅ 5 GB Storage
- ✅ **Unlimited** push notifications

**Perfect for:**
- Development
- MVPs
- Small apps (<1K active users)

### Paid Tier (Blaze - Pay as you go)
- $0.06 per 100K reads
- $0.18 per 100K writes
- $0.026/GB storage/month

**Typical costs:**
- Small app (1-5K users): **Free - $10/mo**
- Medium app (10-50K users): **$20-80/mo**
- Large app (100K+ users): **$100-500/mo**

## 🎓 Learn More

### Documentation
- **[FIREBASE_QUICK_START.md](./FIREBASE_QUICK_START.md)** ← **Start here!** 10-minute setup guide
- **[FIREBASE_MOBILE_GUIDE.md](./FIREBASE_MOBILE_GUIDE.md)** - Complete guide with all features

### External Resources
- [Firebase Admin SDK](https://firebase.google.com/docs/admin/setup)
- [Firestore Documentation](https://firebase.google.com/docs/firestore)
- [React Native Firebase](https://rnfirebase.io/)
- [FlutterFire](https://firebase.flutter.dev/)

### Code Examples
- `src/shared/service/firebase/firebase.service.ts` - All Firebase features
- `src/shared/service/multi-database/multi-database.service.ts` - Integration examples
- `src/domain/example/example-database.controller.ts` - Working API

## 🆘 Troubleshooting

### Firebase not connecting
1. ✅ Check `serviceAccountKey.json` path
2. ✅ Verify Firebase project exists
3. ✅ Enable Firestore in Firebase Console
4. ✅ Check service account permissions

### Mobile app can't read Firestore
1. ✅ Add Firebase config to mobile app
2. ✅ Set up security rules (see above)
3. ✅ Generate custom token for authentication
4. ✅ Sign in with custom token before accessing Firestore

### Push notifications not working
1. ✅ Enable Cloud Messaging API in Firebase Console
2. ✅ Request permissions in mobile app
3. ✅ Send FCM token to backend
4. ✅ Test with Firebase Console first

## ✨ Features

- ✅ Real-time chat with instant sync
- ✅ Online/offline presence tracking
- ✅ Push notifications (FCM)
- ✅ File uploads (Firebase Storage)
- ✅ Custom authentication tokens
- ✅ Mobile offline support
- ✅ Scalable to millions of users
- ✅ Production-ready code

## 🚀 Next Steps

1. ✅ **Follow Quick Start** in [FIREBASE_QUICK_START.md](./FIREBASE_QUICK_START.md)
2. ✅ **Test health check** endpoint
3. ✅ **Study example controller** for working code
4. ✅ **Set up mobile app** with Firebase SDK
5. ✅ **Build your first real-time feature!**

---

**Ready to build?** → Start with **[FIREBASE_QUICK_START.md](./FIREBASE_QUICK_START.md)** 🚀

**Questions?** → Read **[FIREBASE_MOBILE_GUIDE.md](./FIREBASE_MOBILE_GUIDE.md)** 📖
