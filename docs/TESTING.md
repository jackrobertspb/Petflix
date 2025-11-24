# 🚀 Petflix Full Stack Testing Guide

## Overview

You now have a **complete full-stack application**:
- ✅ **Backend** - Express.js API with Supabase (PostgreSQL)
- ✅ **Frontend** - React with TypeScript, TailwindCSS, React Router

This guide will help you test the entire application end-to-end.

---

## 🔧 Pre-Testing Setup

### 1. Backend Setup (Port 5001)

**Location:** `C:\Users\jack\petflix\Petflix-1\`

#### Check Environment Variables:
```bash
type .env
```

Should contain:
```
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
JWT_SECRET=your_random_secret_key
JWT_EXPIRES_IN=7d
PORT=5001
NODE_ENV=development
YOUTUBE_API_KEY=your_youtube_api_key
```

#### Start Backend:
```bash
npm run dev
```

Backend should be running at: `http://localhost:5001`

### 2. Frontend Setup (Port 5173)

**Location:** `C:\Users\jack\petflix\Petflix-Frontend\`

#### Check Environment Variables:
```bash
type .env
```

Should contain:
```
VITE_API_URL=http://localhost:5001/api/v1
```

#### Start Frontend:
```bash
npm run dev
```

Frontend should be running at: `http://localhost:5173`

---

## 🧪 Full Testing Flow

### Phase 1: Guest User (Unauthenticated)

#### Test 1: Landing Page
1. Open browser to `http://localhost:5173`
2. ✅ Should see "Welcome to Petflix! 🐾"
3. ✅ Should see "Get Started" and "Browse Videos" buttons
4. ✅ Should see trending videos grid (if any videos exist)
5. ✅ Navbar should show "Search" and "Login"

#### Test 2: Search Videos (Guest)
1. Click "Search" in navbar or navigate to `/search`
2. Enter "cute cats" or "funny dogs"
3. Click "Search"
4. ✅ Should see video results with thumbnails
5. Click on a video
6. ✅ Should see video detail page with YouTube player
7. ✅ Should see "Login to comment" message

---

### Phase 2: User Registration

#### Test 3: Register New Account
1. Navigate to `/register` or click "Get Started"
2. Try invalid data first:
   - Username: `ab` (too short)
   - Password: `weak` (no uppercase, no number)
   - ✅ Should show validation errors
3. Fill valid data:
   - Username: `petlover123`
   - Email: `petlover123@example.com`
   - Password: `Test1234!`
   - Confirm Password: `Test1234!`
4. Click "Register"
5. ✅ Should redirect to `/feed`
6. ✅ Navbar should now show "Search", "Feed", "Profile", "Logout"
7. ✅ Check browser localStorage - should have JWT token

**Backend Verification:**
```bash
# In backend terminal, you should see:
POST /api/v1/auth/register 201
```

---

### Phase 3: Authentication

#### Test 4: Logout and Login
1. Click "Logout" in navbar
2. ✅ Should redirect to landing page
3. ✅ Navbar should show "Login" again
4. Click "Login"
5. Enter credentials from registration:
   - Email: `petlover123@example.com`
   - Password: `Test1234!`
6. Click "Login"
7. ✅ Should redirect to `/feed`
8. ✅ Should be authenticated again

**Backend Verification:**
```bash
POST /api/v1/auth/login 200
```

#### Test 5: Protected Routes
1. While logged out, try to navigate to `/feed`
2. ✅ Should automatically redirect to `/login`
3. Login and navigate to `/feed`
4. ✅ Should successfully access feed

---

### Phase 4: Video Interactions

#### Test 6: View Video Details
1. While logged in, go to `/search`
2. Search for videos
3. Click on a video
4. ✅ Should see:
   - YouTube player
   - Video title and description
   - "Shared by @username" link
   - Comments section
   - Comment form

**Backend Verification:**
```bash
GET /api/v1/videos/:id 200
GET /api/v1/videos/:id/comments 200
```

#### Test 7: Post Comments
1. On video detail page, scroll to comments
2. Type a comment: "Such a cute pet! 🐾"
3. Click "Post Comment"
4. ✅ Comment should appear immediately in the list
5. ✅ Should show your username
6. ✅ Should show current date

**Backend Verification:**
```bash
POST /api/v1/videos/:id/comments 201
```

---

### Phase 5: User Profiles

#### Test 8: View Your Profile
1. Click "Profile" in navbar
2. ✅ Should see your username (@petlover123)
3. ✅ Should see profile picture placeholder (🐾)
4. ✅ Should see "Edit Profile" button
5. ✅ Should see "Shared Videos (0)" section
6. ✅ Should see "No videos shared yet" message

**Backend Verification:**
```bash
GET /api/v1/users/:userId 200
GET /api/v1/videos?userId=:userId 200
```

#### Test 9: View Other User's Profile
1. From any video, click on "Shared by @username"
2. ✅ Should navigate to their profile
3. ✅ Should see their username
4. ✅ Should see "Follow" button (not "Edit Profile")
5. ✅ Should see their shared videos

#### Test 10: Follow/Unfollow User
1. On another user's profile, click "Follow"
2. ✅ Button should change to "Unfollow"
3. ✅ Button color should change
4. Click "Unfollow"
5. ✅ Button should change back to "Follow"

**Backend Verification:**
```bash
POST /api/v1/follows/:userId 201
DELETE /api/v1/follows/:userId 200
```

---

### Phase 6: Feed

#### Test 11: Personalized Feed
1. Navigate to `/feed` (or click "Feed" in navbar)
2. ✅ Should see video grid
3. ✅ Each video card should show:
   - Thumbnail
   - Title
   - Description preview
   - Username link
4. ✅ If no videos, should see empty state with "Browse Videos" button

**Backend Verification:**
```bash
GET /api/v1/videos?limit=20 200
```

---

## 🎯 Advanced Testing (Optional)

### Test 12: Register Second User
1. Logout from first account
2. Register a new user:
   - Username: `doglover456`
   - Email: `doglover456@example.com`
   - Password: `Test5678!`
3. Go to first user's profile: `/profile/:firstUserId`
4. Click "Follow"
5. Post comments on videos
6. Verify both users can interact

### Test 13: YouTube Integration
1. Search for "cute cats"
2. ✅ Results should come from YouTube
3. Click on a video
4. ✅ YouTube player should load and be playable
5. ✅ Video should play without errors

---

## 🐛 Common Issues & Fixes

### Issue: "Network Error" on Login/Register
**Cause:** Backend not running or wrong API URL

**Fix:**
1. Check backend is running on port 5001
2. Verify frontend `.env` has correct `VITE_API_URL`
3. Restart frontend dev server after changing `.env`

---

### Issue: "CORS Error" in Browser Console
**Cause:** CORS not configured in backend

**Fix:**
Check `src/server.ts` has:
```typescript
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
```

---

### Issue: Videos Not Loading
**Cause:** YouTube API key missing or invalid

**Fix:**
1. Check backend `.env` has `YOUTUBE_API_KEY`
2. Get key from [Google Cloud Console](https://console.cloud.google.com/)
3. Enable YouTube Data API v3
4. Restart backend

---

### Issue: "User Not Found" After Login
**Cause:** Database schema not set up

**Fix:**
1. Run database schema:
   ```bash
   # In Supabase SQL editor, run:
   src/db/schema.sql
   ```
2. Try registering again

---

### Issue: Port Already in Use
**Cause:** Previous process still running

**Fix (Windows):**
```bash
# Kill all node processes
taskkill /F /IM node.exe

# Or find specific port and kill it
netstat -ano | findstr :5001
taskkill /PID <PID> /F
```

---

## 📊 Backend API Endpoint Summary

Here's what the frontend calls:

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/auth/register` | POST | Register new user |
| `/auth/login` | POST | Login user |
| `/users/:id` | GET | Get user details |
| `/videos` | GET | List videos |
| `/videos/:id` | GET | Get video details |
| `/videos/search` | GET | Search videos |
| `/videos/:id/comments` | GET | Get comments |
| `/videos/:id/comments` | POST | Post comment |
| `/follows/:userId` | POST | Follow user |
| `/follows/:userId` | DELETE | Unfollow user |
| `/follows/following/:userId` | GET | Check follow status |
| `/playlists` | GET | Get playlists |

---

## ✅ Testing Checklist

Use this checklist to ensure everything works:

### Guest User
- [ ] Landing page loads
- [ ] Can search for videos
- [ ] Can view video details
- [ ] Redirected to login when accessing /feed

### Authentication
- [ ] Can register with valid data
- [ ] Registration validation works
- [ ] Can login with credentials
- [ ] Can logout
- [ ] Token stored in localStorage
- [ ] Protected routes work

### Videos
- [ ] Can search videos from YouTube
- [ ] Video thumbnails display
- [ ] YouTube player loads and plays
- [ ] Can view video details

### Comments
- [ ] Can post comments (when logged in)
- [ ] Comments display with username and date
- [ ] "Login to comment" shown when logged out

### Profiles
- [ ] Can view own profile
- [ ] Can view other users' profiles
- [ ] "Edit Profile" button on own profile
- [ ] "Follow" button on other profiles
- [ ] Can follow/unfollow users

### Feed
- [ ] Feed loads videos
- [ ] Video cards display correctly
- [ ] Can navigate to video details from feed
- [ ] Empty state shows when no videos

---

## 🎉 Success Criteria

Your app is working correctly if:

1. ✅ Users can register and login
2. ✅ YouTube videos load and play
3. ✅ Users can post comments
4. ✅ Users can view profiles
5. ✅ Users can follow each other
6. ✅ Protected routes require authentication
7. ✅ Navigation works smoothly
8. ✅ No console errors
9. ✅ Responsive design works on different screen sizes
10. ✅ Backend API responds correctly

---

## 🚀 Next Steps After Testing

Once everything is working:

1. **Add Missing Features:**
   - Video sharing form (POST YouTube URLs)
   - Playlist creation UI
   - Video reporting modal
   - Profile editing form

2. **Polish UI:**
   - Add loading spinners
   - Add toast notifications
   - Add animations
   - Improve error messages

3. **Deploy:**
   - Frontend: Vercel or Netlify
   - Backend: Railway, Render, or Heroku
   - Database: Already on Supabase (cloud)

4. **PWA Features:**
   - Add manifest.json
   - Add service worker
   - Enable installability

---

**Happy Testing! 🐾**

If you encounter any issues, check the troubleshooting section or examine the browser console and backend terminal for error messages.

