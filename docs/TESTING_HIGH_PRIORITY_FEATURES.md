# Testing Guide - High Priority Features

## Prerequisites

1. **Run SQL Migrations First!**
   - Open Supabase SQL Editor
   - Run all 4 migration files in order:
     1. `petflix/backend/src/db/add-view-tracking.sql`
     2. `petflix/backend/src/db/add-view-increment-function.sql`
     3. `petflix/backend/src/db/add-search-history.sql`
     4. `petflix/backend/src/db/add-playlist-video-order.sql`
     5. `petflix/backend/src/db/add-email-verification.sql`

2. **Backend Running:**
   ```bash
   cd petflix/backend
   npm run dev
   ```

3. **Frontend Running:**
   ```bash
   cd petflix/frontend
   npm run dev
   ```

---

## 1. Email Verification Testing

### Test Email Update Flow

**Step 1: Request Email Update**
```bash
# Login first to get token
POST http://localhost:5001/api/v1/auth/login
Body: { "email": "your@email.com", "password": "yourpassword" }

# Update email (replace {userId} and {token})
PATCH http://localhost:5001/api/v1/users/{userId}/email
Headers: { "Authorization": "Bearer {token}" }
Body: { "email": "newemail@example.com" }
```

**Expected Result:**
- Response: "A verification email has been sent..."
- Check backend console for verification link (dev mode)
- Email NOT updated yet (still old email)

**Step 2: Verify Email**
```bash
# Use token from console output
POST http://localhost:5001/api/v1/auth/verify-email
Body: { "token": "{verification_token_from_console}" }
```

**Expected Result:**
- Response: "Email address has been verified and updated successfully"
- Check user profile - email should be updated
- Old email no longer works for login

**Step 3: Test Invalid Token**
```bash
POST http://localhost:5001/api/v1/auth/verify-email
Body: { "token": "invalid-token" }
```

**Expected Result:**
- Error: "Email verification link is invalid or has expired"

---

## 2. Video View Tracking Testing

### Test View Count Increment

**Step 1: Get Video ID**
```bash
GET http://localhost:5001/api/v1/videos
# Pick any video ID from response
```

**Step 2: View Video Multiple Times**
```bash
# Visit video detail page multiple times
GET http://localhost:5001/api/v1/videos/{videoId}
```

**Expected Result:**
- Each request increments `view_count`
- Check response - `view_count` should increase
- Check database: `SELECT view_count FROM videos WHERE id = '{videoId}'`

**Step 3: Check View Analytics**
```sql
-- In Supabase SQL Editor
SELECT * FROM video_views 
WHERE video_id = '{videoId}' 
ORDER BY viewed_at DESC 
LIMIT 10;
```

**Expected Result:**
- Should see individual view records
- Each view has timestamp, user_id (if logged in), IP address

---

## 3. Trending Algorithm Testing

### Test Trending Endpoint

**Step 1: Create Some Engagement**
1. Share a few videos
2. Like some videos
3. Comment on some videos
4. View videos multiple times

**Step 2: Check Trending**
```bash
GET http://localhost:5001/api/v1/videos/trending?limit=12
```

**Expected Result:**
- Videos sorted by trending score
- Videos with most recent views + engagement appear first
- Response includes `view_count` for each video

**Step 3: Check Landing Page**
1. Visit `http://localhost:5173/` (or your frontend URL)
2. Should see "Trending Now" section
3. Videos should be ordered by trending score

**Step 4: Verify Algorithm**
```sql
-- Check view velocity (views in last 24 hours)
SELECT 
  v.id,
  v.title,
  v.view_count,
  COUNT(vv.id) as recent_views_24h,
  (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) as likes,
  (SELECT COUNT(*) FROM comments WHERE video_id = v.id) as comments
FROM videos v
LEFT JOIN video_views vv ON vv.video_id = v.id 
  AND vv.viewed_at > NOW() - INTERVAL '24 hours'
GROUP BY v.id
ORDER BY (COUNT(vv.id) * 2 + (SELECT COUNT(*) FROM video_likes WHERE video_id = v.id) + (SELECT COUNT(*) FROM comments WHERE video_id = v.id)) DESC;
```

---

## 4. Search History Tracking Testing

### Test Search History

**Step 1: Login**
```bash
POST http://localhost:5001/api/v1/auth/login
Body: { "email": "your@email.com", "password": "yourpassword" }
# Save token
```

**Step 2: Perform Searches**
```bash
# Search with authentication
GET http://localhost:5001/api/v1/videos/search?q=cute%20cats
Headers: { "Authorization": "Bearer {token}" }

GET http://localhost:5001/api/v1/videos/search?q=funny%20dogs
Headers: { "Authorization": "Bearer {token}" }
```

**Step 3: Check Search History**
```sql
-- In Supabase SQL Editor
SELECT * FROM search_history 
WHERE user_id = '{your_user_id}' 
ORDER BY created_at DESC;
```

**Expected Result:**
- Should see search queries logged
- Each entry has: query, results_count, timestamp
- Guest searches (no auth) are NOT tracked

**Step 4: Test Guest Search**
```bash
# Search without authentication
GET http://localhost:5001/api/v1/videos/search?q=test
# No Authorization header
```

**Expected Result:**
- Search works normally
- No entry in search_history (guests not tracked)

---

## 5. Playlist Video Reordering Testing

### Test Playlist Reordering

**Step 1: Create Playlist**
```bash
POST http://localhost:5001/api/v1/playlists
Headers: { "Authorization": "Bearer {token}" }
Body: { "name": "Test Playlist", "visibility": "private" }
# Save playlistId
```

**Step 2: Add Videos to Playlist**
```bash
# Add first video
POST http://localhost:5001/api/v1/playlists/{playlistId}/videos
Headers: { "Authorization": "Bearer {token}" }
Body: { "video_id": "{videoId1}" }

# Add second video
POST http://localhost:5001/api/v1/playlists/{playlistId}/videos
Body: { "video_id": "{videoId2}" }

# Add third video
POST http://localhost:5001/api/v1/playlists/{playlistId}/videos
Body: { "video_id": "{videoId3}" }
```

**Step 3: Check Initial Order**
```bash
GET http://localhost:5001/api/v1/playlists/{playlistId}/videos
```

**Expected Result:**
- Videos in order: video1 (position 0), video2 (position 1), video3 (position 2)

**Step 4: Reorder Videos**
```bash
# Reverse the order
PATCH http://localhost:5001/api/v1/playlists/{playlistId}/videos/reorder
Headers: { "Authorization": "Bearer {token}" }
Body: {
  "video_orders": [
    { "video_id": "{videoId3}", "position": 0 },
    { "video_id": "{videoId2}", "position": 1 },
    { "video_id": "{videoId1}", "position": 2 }
  ]
}
```

**Expected Result:**
- Response: "Playlist videos reordered successfully"
- Check playlist again - videos should be in new order

**Step 5: Verify in Database**
```sql
SELECT video_id, position 
FROM playlist_videos 
WHERE playlist_id = '{playlistId}' 
ORDER BY position;
```

**Expected Result:**
- Positions should match the reorder request

---

## 6. Integration Testing

### Full Flow Test

1. **Register new user** → Should receive welcome email (check console)
2. **Login** → Should work
3. **Search for videos** → Should log to search history
4. **View video** → View count should increment
5. **Like video** → Should increase engagement
6. **Comment on video** → Should increase engagement
7. **Check trending** → Video should appear in trending if it has views/engagement
8. **Create playlist** → Should work
9. **Add videos to playlist** → Should assign positions
10. **Reorder playlist** → Should update positions
11. **Update email** → Should require verification
12. **Verify email** → Email should update

---

## 🐛 Troubleshooting

### View Count Not Incrementing
- Check if SQL function exists: `SELECT increment_video_view('...')`
- Check database: `SELECT view_count FROM videos WHERE id = '...'`
- Check backend console for errors

### Trending Not Working
- Ensure videos have views in last 24 hours
- Check if `video_views` table has data
- Verify likes/comments exist

### Search History Not Tracking
- Ensure user is logged in (has Authorization header)
- Check `search_history` table exists
- Check backend console for errors

### Playlist Reordering Not Working
- Check if `position` column exists: `SELECT position FROM playlist_videos LIMIT 1`
- Verify playlist belongs to user
- Check API response for errors

### Email Verification Not Working
- Check if `email_verification_tokens` table exists
- Verify token hasn't expired (24 hours)
- Check backend console for verification link

---

## ✅ Success Criteria

All features are working if:
- ✅ Email verification link works and updates email
- ✅ View count increases when viewing videos
- ✅ Trending shows videos with most engagement
- ✅ Search history logs queries for logged-in users
- ✅ Playlist videos can be reordered via API

---

## 📝 Notes

- All features use async operations to avoid blocking requests
- Email service logs to console in development mode
- View tracking happens automatically on video page load
- Trending algorithm recalculates on each request
- Search history only tracks authenticated users
- Playlist reordering requires ownership verification

