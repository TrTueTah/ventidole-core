# Deep Link Debugging Guide

## Current Issue
Deep links are not navigating to PaymentSuccess screen when the app is already open, and no logs are appearing.

## Debugging Steps

### Step 1: Verify Logs Are Working

1. **Check Metro Bundler Terminal** - Look for these logs when the app starts:
   ```
   Setting up deep link listeners...
   getInitialURL result: null (or a URL)
   Navigation is ready
   ```

2. **If you don't see these logs**, the app hasn't reloaded with the new code. Do this:
   - Press `r` in Metro terminal to reload
   - OR shake device/simulator and select "Reload"
   - OR press `Cmd+R` in iOS Simulator

### Step 2: Test Deep Link While App is Open

1. **Make sure app is in foreground** (visible on screen)
2. **Run the deep link command**:
   ```bash
   npx uri-scheme open "ventidole://payment/success/ORDER123" --ios
   ```

3. **Check Metro terminal for**:
   ```
   Deep link event received: { url: 'ventidole://payment/success/ORDER123' }
   Deep link URL: ventidole://payment/success/ORDER123
   Navigation state changed: PaymentSuccess
   ```

### Step 3: Test Deep Link from Background

1. **Send app to background** (swipe up or press Home)
2. **Run deep link command again**
3. **App should come to foreground AND navigate to PaymentSuccess**

### Step 4: Alternative Testing Method

Instead of using `npx uri-scheme`, try this:

**iOS Simulator:**
```bash
xcrun simctl openurl booted "ventidole://payment/success/ORDER123"
```

**Physical iOS Device:**
- Open Safari
- Type in address bar: `ventidole://payment/success/ORDER123`
- Press Go
- App should open and navigate

### Step 5: Check for iOS-Specific Issues

If deep links work when app is closed but not when app is open, this is a known iOS issue with certain React Native versions. Try:

1. **Rebuild the app** (required after Info.plist changes):
   ```bash
   cd ios
   pod install
   cd ..
   yarn ios
   ```

2. **Check if logs appear after rebuild**

### Step 6: Manual Navigation Test

To verify the screens work (independent of deep linking), add this temporary code to test navigation:

Add to any screen (e.g., Shop screen):
```tsx
import { useNavigation } from '@react-navigation/native';
import { Button } from 'react-native';

// Inside component:
const navigation = useNavigation();

// Add button:
<Button
  title="Test PaymentSuccess"
  onPress={() => navigation.navigate('PaymentSuccess', { orderId: 'TEST123' })}
/>
```

If manual navigation works but deep links don't, the issue is with the linking configuration.

## Expected Behavior

### When App is Closed
1. Run: `npx uri-scheme open "ventidole://payment/success/ORDER123" --ios`
2. App opens
3. App navigates directly to PaymentSuccess screen
4. Logs show: "Initial URL: ventidole://payment/success/ORDER123"

### When App is Open  
1. Run: `npx uri-scheme open "ventidole://payment/success/ORDER123" --ios`
2. Deep link event is received (log appears)
3. React Navigation processes the URL
4. App navigates to PaymentSuccess screen
5. Logs show: "Deep link event received" and "Navigation state changed"

## Common Issues

### Issue 1: No Logs at All
**Cause:** App hasn't reloaded with new code
**Fix:** Reload app (press R in Metro, or Cmd+R in simulator)

### Issue 2: Logs Show But No Navigation
**Cause:** Linking configuration mismatch
**Fix:** Check that:
- Screen name in RootStackNavigator matches the linking config
- Path format is correct: `payment/success/:orderId`
- Navigation ref is properly set

### Issue 3: Works When Closed, Not When Open
**Cause:** iOS doesn't send URL events to already-running apps in some cases
**Fix:** 
- This is often due to how `uri-scheme` works
- Try using `xcrun simctl openurl` instead
- Or test with real Safari browser

### Issue 4: "Setting up deep link listeners..." Never Appears
**Cause:** App crashed or useEffect not running
**Fix:** Check for errors in Metro terminal

## Next Steps

1. ✅ Reload the app
2. ✅ Check Metro terminal for "Setting up deep link listeners..."
3. ✅ Run deep link command
4. ✅ Report what logs you see (if any)

If still not working, we may need to:
- Add AppDelegate.swift modifications for iOS
- Use a different deep linking library
- Implement manual URL handling
