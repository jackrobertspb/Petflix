# 🧪 Petflix Testing Sheet

## 📋 Pre-Testing Checklist

Before you start, verify:

- [ ] **Backend running** - Terminal shows "Server running on port 5001"
- [ ] **Frontend running** - Terminal shows "Local: http://localhost:5173/"
- [ ] **Browser open** - Navigate to `http://localhost:5173`

---

## ✅ Test 1: Landing Page

**URL:** `http://localhost:5173`

### Steps:
1. Open the URL in your browser
2. Observe the page

### Expected Results:
- [ ] Page loads with dark Netflix-style theme
- [ ] Navbar shows "PETFLIX" logo with paw emoji 🐾
- [ ] Hero section displays "Unlimited pet videos, purrs, and paws 🐾"
- [ ] Two buttons visible: "Get Started" and "Browse Videos"
- [ ] "Trending Now" section at bottom
- [ ] Message: "No videos yet" (since database is empty)

### If Failed:
**Report:** Screenshot of what you see + any error messages in browser console (F12 → Console tab)

---

## ✅ Test 2: Navigation (Guest)

**URL:** `http://localhost:5173`

### Steps:
1. Click "Browse" in navbar
2. Note what happens
3. Try to manually navigate to `http://localhost:5173/feed`

### Expected Results:
- [ ] "Browse" takes you to `/search`
- [ ] Manually going to `/feed` redirects you to `/login` (protected route)

### If Failed:
**Report:** Where did it take you instead? Any errors?

---

## ✅ Test 3: User Registration

**URL:** `http://localhost:5173/register`

### Steps:
1. Click "Get Started" or go to `/register`
2. Fill in the form:
   - **Username:** `testpet123`
   - **Email:** `testpet123@example.com`
   - **Password:** `Test1234!`
   - **Confirm Password:** `Test1234!`
3. Click eye icon to verify password visibility toggle works
4. Click "Sign Up"

### Expected Results:
- [ ] Form loads with dark theme
- [ ] Eye icon is grayed out when fields are empty
- [ ] Eye icon becomes clickable when you type
- [ ] Password toggles between hidden/visible when clicking eye
- [ ] After clicking "Sign Up", shows loading state ("Creating Account...")
- [ ] Redirects to `/feed` after successful registration
- [ ] Navbar changes to show "My Feed", "Profile", "Sign Out"

### If Failed:
**Report:** 
- Error message shown (copy exact text)
- Where did it redirect you?
- Browser console errors (F12 → Console)

**Common Issues:**
- ❌ "Network Error" → Backend isn't running
- ❌ "Email already exists" → User already registered, try different email
- ❌ Still on register page → Check browser console for errors

---

## ✅ Test 4: Logout & Login

**URL:** After Test 3 (you're logged in)

### Steps:
1. Click "Sign Out" in navbar
2. Verify you're logged out
3. Click "Sign In" in navbar
4. Enter credentials from Test 3:
   - **Email:** `testpet123@example.com`
   - **Password:** `Test1234!`
5. Click "Sign In"

### Expected Results:
- [ ] After logout, navbar shows "Browse" and "Sign In"
- [ ] Redirected to home page
- [ ] Login form appears
- [ ] After login, redirected to `/feed`
- [ ] Navbar shows authenticated options again

### If Failed:
**Report:** Error message + console errors

---

## ✅ Test 5: Protected Route Access

**URL:** `http://localhost:5173`

### Steps:
1. Make sure you're logged OUT
2. Try to navigate directly to `http://localhost:5173/feed`

### Expected Results:
- [ ] Automatically redirected to `/login`
- [ ] Login form appears

### If Failed:
**Report:** Did you access the feed without logging in?

---

## ✅ Test 6: Feed Page (Empty State)

**URL:** `http://localhost:5173/feed` (while logged in)

### Steps:
1. Login if needed
2. Navigate to "My Feed"

### Expected Results:
- [ ] Page loads with dark theme
- [ ] Shows "Your Feed 🎬" heading
- [ ] Shows message: "Your feed is empty!"
- [ ] Shows "Browse Videos" button
- [ ] No videos displayed (database is empty)

### If Failed:
**Report:** What appears instead? Any errors?

---

## ✅ Test 7: Search Page

**URL:** `http://localhost:5173/search`

### Steps:
1. Click "Browse" or "Search" in navbar
2. Type in search box: `cute cats`
3. Click "Search" button

### Expected Results:
- [ ] Search page loads with large search input
- [ ] Shows "Search Pet Videos 🔍" heading
- [ ] After searching, shows "Searching..." loading state
- [ ] **WILL LIKELY FAIL** - Needs YouTube API key

### Expected Failure:
- [ ] Error message or "No videos found"
- [ ] Backend error in terminal about YouTube API

**This is NORMAL** - We haven't set up YouTube API yet!

### If Different Failure:
**Report:** Exact error message

---

## ✅ Test 8: Profile Page

**URL:** `http://localhost:5173/profile/YOUR_USER_ID`

### Steps:
1. While logged in, click "Profile" in navbar
2. Observe the page

### Expected Results:
- [ ] Profile page loads
- [ ] Shows your username (@testpet123)
- [ ] Shows placeholder profile picture (🐾)
- [ ] Shows "Edit Profile" button
- [ ] Shows "Shared Videos (0)" section
- [ ] Message: "No videos shared yet"

### If Failed:
**Report:** What appears? Console errors?

---

## ✅ Test 9: Video Detail Page (Will Fail - No Videos Yet)

**URL:** Try to navigate to any video

### Steps:
1. This test will fail since we have no videos in database
2. Skip for now ⏭️

---

## ✅ Test 10: Backend Health Check

**URL:** `http://localhost:5001/health`

### Steps:
1. Open this URL in a new browser tab

### Expected Results:
- [ ] Shows JSON: `{"status":"ok","timestamp":"..."}`

### If Failed:
**Report:** 
- Browser shows "can't be reached" → Backend not running
- Shows `{"error":"Route not found"}` → Wrong URL or backend issue

---

## 📊 Results Summary

Fill this out after testing:

### ✅ Passed Tests:
- Test #: ____
- Test #: ____
- Test #: ____

### ❌ Failed Tests:
- Test #: ____ - Reason: ______________________
- Test #: ____ - Reason: ______________________

### ⚠️ Skipped Tests:
- Test #: ____ - Reason: ______________________

---

## 🚨 Report Issues

**When something fails, provide:**

1. **Test Number:** (e.g., Test 3)
2. **What happened:** (e.g., "Got error message: Network Error")
3. **Screenshot:** (if visual issue)
4. **Console errors:** (F12 → Console → copy any red errors)
5. **Backend logs:** (check terminal running backend for errors)

---

## 📝 Example Issue Report:

```
TEST 3 FAILED: User Registration

What happened:
- Clicked "Sign Up" button
- Got error: "Network Error"

Browser Console:
- POST http://localhost:5001/api/v1/auth/register net::ERR_CONNECTION_REFUSED

Backend Terminal:
- Not seeing any requests coming in
- Server appears stopped

Screenshot: [attached]
```

---

## 🎯 Next Steps After Testing

Based on test results, we'll either:
1. ✅ **All Passed** → Add YouTube API key, build video sharing
2. ❌ **Some Failed** → Debug and fix issues first
3. ⚠️ **Backend Issues** → Check database connection, env variables

---

**Start with Test 1 and work your way down!** Report back with results! 🧪🐾

