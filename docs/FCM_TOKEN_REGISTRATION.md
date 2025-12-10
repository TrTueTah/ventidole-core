# FCM Token Registration for Push Notifications

## Overview

This endpoint allows mobile apps to register Firebase Cloud Messaging (FCM) tokens with Knock to enable push notifications.

## Endpoint

```
POST /v1/knock/fcm-token
```

**Authentication:** Required (JWT Bearer token)

## Request

### Headers
```
Authorization: Bearer <jwt-token>
Content-Type: application/json
```

### Body
```json
{
  "fcmToken": "fGHj8kL9mN0pQ1rS2tU3vW4xY5zA6bC7dE8fG9hI0jK1lM2nO3pQ4rS5tU6vW7xY8zA9"
}
```

**Parameters:**
- `fcmToken` (string, required): Firebase Cloud Messaging device token

## Response

### Success Response (200 OK)
```json
{
  "statusCode": 200,
  "message": "OK",
  "data": {
    "success": true,
    "message": "FCM token registered successfully"
  },
  "error": null,
  "errorCode": null
}
```

### Error Responses

#### 400 Bad Request - Invalid FCM Token
```json
{
  "statusCode": 400,
  "message": "Bad Request",
  "data": null,
  "error": "Invalid FCM token",
  "errorCode": "InvalidFcmToken"
}
```

#### 404 Not Found - User Not Found
```json
{
  "statusCode": 404,
  "message": "Not Found",
  "data": null,
  "error": "User not found",
  "errorCode": "UserNotFound"
}
```

#### 500 Internal Server Error - Push Channel Not Configured
```json
{
  "statusCode": 500,
  "message": "Internal Server Error",
  "data": null,
  "error": "Push channel not configured",
  "errorCode": "KnockPushChannelNotConfigured"
}
```

#### 500 Internal Server Error - Registration Failed
```json
{
  "statusCode": 500,
  "message": "Internal Server Error",
  "data": null,
  "error": "Failed to register FCM token",
  "errorCode": "KnockFcmTokenRegistrationFailed"
}
```

## How It Works

1. **User Authentication**: The endpoint extracts the user ID from the JWT token
2. **User Lookup**: Fetches user details (email, username, avatar) from the database
3. **Knock User Registration**: Ensures the user exists in Knock with their profile data
4. **Token Registration**: Registers the FCM token with Knock's push notification channel
5. **Success Response**: Returns confirmation that the token was registered

## Usage Example

### React Native / Expo

```typescript
import messaging from '@react-native-firebase/messaging';
import axios from 'axios';

// Get FCM token
async function registerForPushNotifications() {
  try {
    // Request permission
    const authStatus = await messaging().requestPermission();
    const enabled =
      authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
      authStatus === messaging.AuthorizationStatus.PROVISIONAL;

    if (!enabled) {
      console.log('Push notification permission denied');
      return;
    }

    // Get FCM token
    const fcmToken = await messaging().getToken();

    // Register with backend
    const response = await axios.post(
      'https://api.ventidole.com/v1/knock/fcm-token',
      { fcmToken },
      {
        headers: {
          Authorization: `Bearer ${jwtToken}`,
        },
      }
    );

    console.log('FCM token registered:', response.data);
  } catch (error) {
    console.error('Failed to register FCM token:', error);
  }
}

// Call this when user logs in
registerForPushNotifications();
```

### Flutter

```dart
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:http/http.dart' as http;
import 'dart:convert';

Future<void> registerFcmToken(String jwtToken) async {
  try {
    // Get FCM token
    String? fcmToken = await FirebaseMessaging.instance.getToken();

    if (fcmToken == null) {
      print('Failed to get FCM token');
      return;
    }

    // Register with backend
    final response = await http.post(
      Uri.parse('https://api.ventidole.com/v1/knock/fcm-token'),
      headers: {
        'Authorization': 'Bearer $jwtToken',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'fcmToken': fcmToken,
      }),
    );

    if (response.statusCode == 200) {
      print('FCM token registered successfully');
    } else {
      print('Failed to register FCM token: ${response.body}');
    }
  } catch (error) {
    print('Error registering FCM token: $error');
  }
}
```

## Environment Variables Required

Ensure the following environment variables are set:

```env
# Knock Configuration
KNOCK_SECRET_KEY=sk_test_your_secret_key_here
KNOCK_SIGNING_KEY=your_signing_key_here
KNOCK_PUSH_CHANNEL_ID=your-push-channel-uuid  # Required for FCM registration
```

## Setup in Knock Dashboard

1. Go to [Knock Dashboard](https://dashboard.knock.app/)
2. Navigate to **Channels** → **Push**
3. Create or configure your Firebase push channel
4. Copy the Channel ID
5. Add it to your `.env` file as `KNOCK_PUSH_CHANNEL_ID`

## Related Endpoints

- `POST /v1/knock/token` - Generate Knock authentication token for in-app notifications
- `POST /v1/knock/notifications/in-app` - Send in-app notification

## Best Practices

1. **Register on Login**: Call this endpoint after successful user login
2. **Refresh Periodically**: FCM tokens can change, refresh them periodically (e.g., on app startup)
3. **Handle Token Refresh**: Listen for FCM token refresh events and re-register
4. **Error Handling**: Implement proper error handling for network failures
5. **Permission Check**: Always check notification permissions before registering

## Testing

### Using curl

```bash
curl -X POST https://api.ventidole.com/v1/knock/fcm-token \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fcmToken": "your-fcm-token-here"
  }'
```

### Using Postman

1. Create a new POST request
2. URL: `https://api.ventidole.com/v1/knock/fcm-token`
3. Headers:
   - `Authorization`: `Bearer YOUR_JWT_TOKEN`
   - `Content-Type`: `application/json`
4. Body (raw JSON):
   ```json
   {
     "fcmToken": "your-fcm-token-here"
   }
   ```

## Troubleshooting

### Error: "Push channel not configured"
- Ensure `KNOCK_PUSH_CHANNEL_ID` is set in your environment variables
- Verify the channel ID is correct in Knock Dashboard

### Error: "User not found"
- The JWT token may be invalid or expired
- The user may have been deleted from the database

### Error: "Failed to register FCM token"
- Check Knock service logs for more details
- Verify Knock API credentials are correct
- Ensure the Knock push channel is properly configured

---

**Last Updated:** December 8, 2025
**Status:** ✅ Ready for Use
