# Video Like Notification Debugging Guide

## Setup Required:
1. **Two accounts** needed (Account A owns video, Account B likes it)
2. **Account A** must have push notifications ENABLED in Settings
3. **Account B** will like the video
4. **Account A** should receive notification

## Debug Steps:

### Step 1: Verify Push Notification Setup
**On Account A (video owner):**
```
1. Go to Settings
2. Check "Push Notifications" toggle - should be GREEN
3. Browser should show "Petflix can send notifications" in address bar
```

### Step 2: Check Backend Logs
**When Account B likes the video, check backend terminal for:**
```
✅ Notification sent to user <uuid>
```

If you see:
- `No push subscriptions found for user <uuid>` → Account A doesn't have notifications enabled
- `Failed to send video like notification:` → Error in notification system
- Nothing at all → Route might not be calling the notification function

### Step 3: Verify Like is Registered
**After liking:**
1. Check if like count increased on video
2. Check if heart icon filled in (❤️)
3. Refresh page - like should persist

### Step 4: Manual Test
**In browser console (on Account A), run:**
```javascript
Notification.requestPermission().then(permission => {
  if (permission === "granted") {
    new Notification("Test", { body: "If you see this, notifications work!" });
  }
});
```

If this test notification doesn't appear:
- Check Windows Notification Settings
- Check browser notification permissions
- Try a different browser (Chrome works better than Edge for local dev)

### Step 5: Check Windows Notifications
1. Windows Settings → System → Notifications
2. Ensure notifications are ON
3. Find your browser (Chrome/Edge) in the list
4. Ensure it's allowed to send notifications

## Common Issues:

### Issue: "Already liked this video"
- You're trying to like your own video
- System prevents self-likes (no notification sent)

### Issue: Account A has notifications enabled but gets nothing
- Check if Account B is logged in (can't like without login)
- Check backend terminal for errors
- Verify Account A owns the video being liked

### Issue: Notification permission is "default" not "granted"
- Edge on localhost has issues with notifications
- Try Chrome instead
- Or manually grant permission in browser settings

