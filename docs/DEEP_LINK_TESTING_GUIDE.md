# Deep Link Testing Guide

This guide provides instructions for testing the payment success/failure deep linking implementation.

## Overview

The app now supports deep linking for payment redirects using the `ventidole://` URL scheme. After payment completion via PayOS, users are redirected to either:

- Success: `ventidole://payment/success/:orderId`
- Failure: `ventidole://payment/failure/:orderId`

## Setup

### iOS Setup

1. **Rebuild the app** (required after Info.plist changes):
   ```bash
   cd ios && pod install && cd ..
   yarn ios
   ```

### Android Setup

1. **Rebuild the app** (required after AndroidManifest.xml changes):
   ```bash
   yarn android
   ```

## Testing Methods

### Method 1: Using URI Scheme Command (Recommended for Development)

#### iOS Testing

```bash
# Test payment success
npx uri-scheme open "ventidole://payment/success/ORDER123" --ios

# Test payment failure
npx uri-scheme open "ventidole://payment/failure/ORDER456" --ios
```

#### Android Testing

```bash
# Test payment success
npx uri-scheme open "ventidole://payment/success/ORDER123" --android

# Test payment failure
npx uri-scheme open "ventidole://payment/failure/ORDER456" --android
```

### Method 2: Using ADB (Android Only)

```bash
# Test payment success
adb shell am start -W -a android.intent.action.VIEW -d "ventidole://payment/success/ORDER123" com.tanhtran.ventidole

# Test payment failure
adb shell am start -W -a android.intent.action.VIEW -d "ventidole://payment/failure/ORDER456" com.tanhtran.ventidole
```

### Method 3: Using xcrun (iOS Only)

```bash
# Test payment success
xcrun simctl openurl booted "ventidole://payment/success/ORDER123"

# Test payment failure
xcrun simctl openurl booted "ventidole://payment/failure/ORDER456"
```

### Method 4: Browser Testing (Safari on iOS, Chrome on Android)

1. Open Safari (iOS) or Chrome (Android) on your device/simulator
2. Type in the address bar:
   - Success: `ventidole://payment/success/ORDER123`
   - Failure: `ventidole://payment/failure/ORDER456`
3. Press Enter/Go
4. The app should open and navigate to the appropriate screen

### Method 5: Testing WebView Redirect

To test the actual PayOS WebView redirect flow, you can create a local HTML test file:

1. **Create a test HTML file** (`test-payment.html`):

```html
<!DOCTYPE html>
<html>
  <head>
    <title>Payment Test</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        padding: 20px;
        text-align: center;
      }
      button {
        padding: 15px 30px;
        margin: 10px;
        font-size: 16px;
        cursor: pointer;
        border-radius: 5px;
        border: none;
      }
      .success {
        background-color: #10b981;
        color: white;
      }
      .failure {
        background-color: #ef4444;
        color: white;
      }
    </style>
  </head>
  <body>
    <h1>Payment Gateway Test</h1>
    <p>Click a button to simulate payment completion:</p>

    <button class="success" onclick="redirectSuccess()">
      ✓ Simulate Success
    </button>

    <button class="failure" onclick="redirectFailure()">
      ✗ Simulate Failure
    </button>

    <script>
      function redirectSuccess() {
        window.location.href = 'ventidole://payment/success/TEST_ORDER_123';
      }

      function redirectFailure() {
        window.location.href = 'ventidole://payment/failure/TEST_ORDER_456';
      }
    </script>
  </body>
</html>
```

2. **Host the file locally**:

```bash
# Using Python 3
python3 -m http.server 8000

# Using Node.js (if you have http-server installed)
npx http-server -p 8000
```

3. **Temporarily modify PaymentScreen.tsx** to use your local test URL:

```tsx
// In PaymentScreen.tsx, replace the WebView source temporarily:
<WebView
  source={{ uri: 'http://localhost:8000/test-payment.html' }} // <-- For testing
  // source={{ uri: order.payment.checkoutUrl }}  // <-- Original
  originWhitelist={['*']}
  // ... rest of props
/>
```

4. **Test the flow**:
   - Navigate to Cart → Confirm Order → Payment
   - The WebView will load your test page
   - Click "Simulate Success" or "Simulate Failure"
   - App should navigate to the appropriate screen

## Expected Behavior

### Payment Success Flow

1. URL: `ventidole://payment/success/ORDER123`
2. App navigates to **PaymentSuccessScreen**
3. Screen displays:
   - ✓ Success animation (Lottie)
   - Order details (fetched using `orderId`)
   - "View Order Details" button
   - "Continue Shopping" button

### Payment Failure Flow

1. URL: `ventidole://payment/failure/ORDER456`
2. App navigates to **PaymentFailureScreen**
3. Screen displays:
   - ✗ Failure icon
   - Error message
   - Order details (if available)
   - Common failure reasons
   - "Retry Payment" button
   - "Back to Cart" button
   - "Contact Support" link

## Troubleshooting

### Deep Link Not Opening App

**iOS:**

- Ensure app is installed and running in background
- Check that URL scheme is correctly configured in Info.plist
- Try rebuilding: `cd ios && pod install && cd .. && yarn ios`

**Android:**

- Ensure app is installed
- Check AndroidManifest.xml for correct intent filter
- Try: `adb shell pm clear com.tanhtran.ventidole` then reinstall

### App Opens But Doesn't Navigate

1. **Check console logs** in Metro bundler for errors
2. **Verify navigation config** in App.tsx
3. **Check route names** match in:
   - `src/navigation/types.ts`
   - `src/navigation/pathLocations.ts`
   - `src/navigation/app-stack/ShopStackNavigator.tsx`

### WebView Redirect Not Working

1. **Check onNavigationStateChange** is firing:

   ```tsx
   const handleNavigationStateChange = (navState: any) => {
     console.log('WebView URL:', navState.url); // Add this
     // ... rest of logic
   };
   ```

2. **Verify PayOS is configured** to use correct return URLs:
   - Success URL: `ventidole://payment/success`
   - Failure URL: `ventidole://payment/failure`

## Backend Configuration (PayOS)

To complete the integration, configure PayOS with these return URLs:

```typescript
// When creating payment order
const paymentData = {
  // ... other payment data
  returnUrl: 'ventidole://payment/success',
  cancelUrl: 'ventidole://payment/failure',
};
```

**Note:** The backend should append the `orderId` to these URLs:

- Success: `ventidole://payment/success/${orderId}`
- Failure: `ventidole://payment/failure/${orderId}`

## Production Considerations

### Universal Links (iOS)

For production, consider implementing Universal Links for better security:

1. Add Associated Domains capability in Xcode
2. Create `apple-app-site-association` file:
   ```json
   {
     "applinks": {
       "apps": [],
       "details": [
         {
           "appID": "TEAM_ID.com.tanhtran.ventidole",
           "paths": ["/payment/success/*", "/payment/failure/*"]
         }
       ]
     }
   }
   ```
3. Host at `https://ventidole.com/.well-known/apple-app-site-association`
4. Update linking config to use `https://ventidole.com` prefix

### App Links (Android)

For production, implement App Links:

1. Create Digital Asset Links file (`.well-known/assetlinks.json`)
2. Add to AndroidManifest.xml:
   ```xml
   <intent-filter android:autoVerify="true">
     <action android:name="android.intent.action.VIEW" />
     <category android:name="android.intent.category.DEFAULT" />
     <category android:name="android.intent.category.BROWSABLE" />
     <data android:scheme="https"
           android:host="ventidole.com"
           android:pathPrefix="/payment" />
   </intent-filter>
   ```

## Quick Test Script

Save this as `test-deeplinks.sh`:

```bash
#!/bin/bash

echo "Testing Ventidole Deep Links"
echo "=============================="
echo ""
echo "1. Testing Payment Success (iOS)"
npx uri-scheme open "ventidole://payment/success/TEST123" --ios
sleep 2

echo ""
echo "2. Testing Payment Failure (iOS)"
npx uri-scheme open "ventidole://payment/failure/TEST456" --ios
sleep 2

echo ""
echo "3. Testing Payment Success (Android)"
npx uri-scheme open "ventidole://payment/success/TEST123" --android
sleep 2

echo ""
echo "4. Testing Payment Failure (Android)"
npx uri-scheme open "ventidole://payment/failure/TEST456" --android

echo ""
echo "Testing complete!"
```

Make it executable: `chmod +x test-deeplinks.sh`

Run it: `./test-deeplinks.sh`

## Next Steps

1. ✓ Configure URL schemes (completed)
2. ✓ Create payment result screens (completed)
3. ✓ Add WebView redirect interception (completed)
4. ✓ Test deep links (use this guide)
5. ⏳ Configure PayOS backend with return URLs
6. ⏳ Test end-to-end payment flow
7. ⏳ Implement Universal Links/App Links for production
